import React, { PureComponent } from "react"
import { Dimensions, StyleSheet, TouchableOpacity, View, Text, Image, FlatList, TextInput, ActivityIndicator, Platform, Linking, TouchableWithoutFeedback } from "react-native"
import Header from "../../src/components/Header"
import Footer from "../../src/components/Footer"
import { listConversation, sendPing } from '../apis/conversation'
import { getMessage, sendBlock, sendInput, sendMessage, sendQucickReply, upLoadFile } from '../apis/message'
import { sendGreeting } from '../apis/conversation'
import { app_config } from "../utils/app_config"
import { withPageDataContext } from "../context/PageContext"
import { withUserOnlineContext } from "../context/UserOnlineContext"
import { withSocketContext } from "../context/SocketContext"
import { colors, localStorageKeys, socketUtils } from "../utils/constant"
import moment from 'moment'
import { GiftedChat, Bubble, LoadEarlier, MessageImage } from 'react-native-gifted-chat'
import ImagePicker from 'react-native-image-crop-picker'
import { check, PERMISSIONS, RESULTS, request } from 'react-native-permissions'
import ActionSheet, { SheetManager } from 'react-native-actions-sheet'
import DocumentPicker from 'react-native-document-picker'
import LightBox from 'react-native-lightbox-v2'
import { getLocalData, removeLocalData, storeLocalData } from "react-native-fchat-webchat/src/utils/async_storage"



const action_sheet_id = 'fchat_webchat_image'


const { width, height } = Dimensions.get('window')

class ConversationDetail extends PureComponent {

    constructor(props) {
        super(props)
        this.state = {
            messages: [],
            expandToolChat: false,
            image_selected: false,
            image_loading: false,
            conv: {},
            heightInputChat: 0,
            messageText: '',
            can_load_more: true,
            loading: false
        }
        this._cacheMessageId = []
        this.paging = 1
        this.canSendInput = true
        this.userInput = null
        this.quickReply = null
    }

    sendGreeting = async () => {
        const conv = this.props.navigation.getParam('conv')
        const conv_id = conv._id
        const { sender_id } = app_config.sender_data ?? {}
        const params = { conv_id, sender_id }
        const result = await sendGreeting(params)
    }

    getConversationMessages = async () => {
        const conv = this.props.navigation.getParam('conv')
        const { page, settings } = this.props.pageData ?? {}
        this.setState({ conv })
        const conv_id = conv._id
        const params = {
            conv_id,
            page: this.paging,
            paging: 50,
        }
        this.setState({ loading: true }, async () => {
            const result = await getMessage(params)
            const data = result?.messages
            this.setState({ loading: false }, () => {
                if (data && data?.length > 0) {
                    this.paging += 1
                    let messages = data.map(m => {
                        const message_item = {
                            ...m,
                            payload: m.payload,
                            attachments: m.attachments,
                            fallback: m.fallback,
                            _id: m._id,
                            text: m.message == ':like:' ? '👍' : m.message,
                            image: m.albums[0],
                            blockButton: m.buttons,
                            error_text: m.error_text,
                            createdAt: m.created_at,
                            user: {
                                _id: m.is_Page_Reply ? m.page_id : m.sender?.sender_id,
                                avatar: m.is_Page_Reply ? page?.avatar : null
                            },
                        }
                        return message_item
                    })
                    this.setState({ messages: [...this.state.messages, ...messages], })
                } else {
                    if (this.paging == 1) {
                        this.sendGreeting()
                    }
                    this.setState({
                        can_load_more: false
                    })
                }
            })
        })
    }

    doSendBlock = async (block_id) => {
        const conv = this.props.navigation.getParam('conv')
        let conv_id = conv?._id
        const user_id = app_config.sender_data?.sender_id
        const params = {
            conv_id,
            user_id,
            block_id,
        }
        const result = await sendBlock(params)
    }

    sendInput = async (message) => {
        if (this.canSendInput && this.userInput) {
            const data_userinputnext = this.userInput
            this.canSendInput = false
            const conv = this.props.navigation.getParam('conv')
            let conv_id = conv?._id
            const user_id = app_config.sender_data?.sender_id
            const params = {
                conv_id,
                user_id,
                message,
                data_userinputnext,
            }
            const result = await sendInput(params)
            const { error, input_data } = result ?? {}
            const { stop_block, validate } = input_data ?? {}
            if (!error && (stop_block == '1' || validate)) {
                await this.deleteUserInput()
                this.canSendInput = true
            } else {
                this.canSendInput = true
            }
        }
    }

    _sendToFchat = async (message = '', image, attachments, quick = false) => {
        let { conv } = this.state
        let params = {
            conv_id: conv._id,
            message: message && message != '' ? message : '👍',
            page_id: conv.page_id,
            m_id: Math.floor(Math.random() * 10000),
        }
        if (quick) {
            params.quick = true
        }
        if (image) {
            params.image = image
            params.message = ''
        }
        if (attachments) {
            params.attachments = attachments
            params.message = ''
        }
        const result = await sendMessage(params)
        const { error, data_socket, msg } = result ?? {}
        if (error == false && data_socket && data_socket.message?._id) {
            this.deleteDataQuick()
            this._cacheMessageId.push(data_socket.message.m_id)
            this.props.socket.emit(socketUtils.webchat, data_socket)
        }

    }

    getUserInput = async () => {
        const conv = this.props.navigation.getParam('conv')
        let conv_id = conv?._id
        const result = await getLocalData(`${localStorageKeys.userInput}_${conv_id}`)
        this.userInput = result
    }

    deleteUserInput = async () => {
        this.userInput = null
        const conv = this.props.navigation.getParam('conv')
        let conv_id = conv?._id
        await removeLocalData(`${localStorageKeys.userInput}_${conv_id}`)
    }

    saveUserInput = async (data) => {
        this.userInput = data
        const conv = this.props.navigation.getParam('conv')
        let conv_id = conv?._id
        await storeLocalData(`${localStorageKeys.userInput}_${conv_id}`, data)
    }

    getDataQuick = async () => {
        const conv = this.props.navigation.getParam('conv')
        let conv_id = conv?._id
        const result = await getLocalData(`${localStorageKeys.quickReply}_${conv_id}`)
        if (result) {
            this._addQuickReplyMessage(result)
        }
    }

    deleteDataQuick = async () => {
        const conv = this.props.navigation.getParam('conv')
        let conv_id = conv?._id

        // remove quick msg 
        const msgs = [...this.state.messages]
        const index = msgs.findIndex(e => e.data_quick)
        if (index != -1) {
            msgs.splice(index, 1)
        }
        this.setState({ messages: msgs })
        // delete from local storage
        await removeLocalData(`${localStorageKeys.quickReply}_${conv_id}`)
    }

    saveDataQuick = async (data) => {
        const conv = this.props.navigation.getParam('conv')
        let conv_id = conv?._id
        await storeLocalData(`${localStorageKeys.quickReply}_${conv_id}`, data)
    }

    _doChatText = () => {
        let { messageText } = this.state;
        this._sendToFchat(messageText)
        this.appenTextMessage(messageText)
        this.sendInput(messageText)

    }

    appenTextMessage = (messageText) => {
        const { sender_id, sender_name } = app_config.sender_data
        let _message = {
            _id: Math.floor(Math.random() * 10000),
            text: messageText ? messageText : ' 👍 ',
            createdAt: moment().format(),
            user: {
                _id: sender_id,
                name: sender_name
            },
        }
        this.setState(previousState => ({
            messages: GiftedChat.append(previousState.messages, [_message]),
            messageText: ''
        }))
    }


    sendImage = async (image_selected) => {
        const { sender_id, sender_name } = app_config.sender_data
        if (image_selected?.size <= 3 * 1024 * 1024 && image_selected?.data) {
            const image_data = `data:image/jpeg;base64,${image_selected.data}`
            this._sendToFchat('', image_data)
            let _message = {
                _id: Math.floor(Math.random() * 10000),
                text: '',
                image: image_data,
                createdAt: moment().format(),
                user: {
                    _id: sender_id,
                    name: sender_name
                },
            }
            this.setState(previousState => ({
                messages: GiftedChat.append(previousState.messages, [_message]),
                messageText: ''
            }))
        } else {
        }
        this.deselectImage()
    }

    sendPingConversation = async () => {
        const conv = this.props.navigation.getParam('conv')
        const conversation_id = conv?._id
        const params = {
            conversation_id,
            pingtime: moment().valueOf()
        }
        const result = await sendPing(params)
    }

    componentDidMount = () => {
        this.getDataQuick()
        this.getUserInput()
        this.getConversationMessages()
        this.addSocketListener()
        const send_greeting = this.props.navigation.getParam('send_greeting')
        if (send_greeting) {
            this.sendGreeting()
        }
        this.sendPingConversation()
        this.sendping_interval = setInterval(() => {
            this.sendPingConversation()
        }, 5 * 60 * 1000);
    }

    componentWillUnmount = () => {
        this.removeSocketListener()
        if (this.sendping_interval) {
            clearInterval(this.sendping_interval)
        }
    }


    removeSocketListener = () => {
        this.props.socket.off(socketUtils.newMessage, this._handleNewMessage);
        this.props.socket.off(socketUtils.receiveMessage, this._handleNewMessage);
        this.props.socket.off(socketUtils.userInput, this._handleUserInputSocket);
        this.props.socket.off(socketUtils.quickMessage, this._handleQuickMessageSocket);
    }

    addSocketListener = async () => {
        this.props.socket.on(socketUtils.newMessage, this._handleNewMessage);
        this.props.socket.on(socketUtils.receiveMessage, this._handleNewMessage);
        this.props.socket.on(socketUtils.userInput, this._handleUserInputSocket);
        this.props.socket.on(socketUtils.quickMessage, this._handleQuickMessageSocket);
    }

    _addQuickReplyMessage = (data_quick) => {
        if (data_quick?.quick?.length > 0) {
            const { sender_id, sender_name } = app_config.sender_data
            let _message = {
                _id: Math.floor(Math.random() * 10000),
                text: '',
                createdAt: moment().format(),
                user: {
                    _id: sender_id,
                    name: sender_name
                },
                data_quick,
            }
            this.setState(previousState => ({
                messages: GiftedChat.append(previousState.messages, [_message]),
            }))
        }

    }

    _handleQuickMessageSocket = (data_quick) => {
        this._addQuickReplyMessage(data_quick)
        this.saveDataQuick(data_quick)
    }

    _handleUserInputSocket = (msg) => {
        this.saveUserInput(msg)
    }

    _handleNewMessage = (newMessage) => {
        const { page, settings } = this.props.pageData ?? {}
        let { conv } = this.state;
        if (newMessage?.conversation_id == conv?._id || newMessage?.conversation?._id == conv?._id) {
            if (newMessage?.conversation?.last_mess && this.init_conv) {
                this.init_conv = { ...this.init_conv, ...newMessage.conversation }
            }
            if (!newMessage.message.is_Page_Reply) {
                if (this._cacheMessageId.indexOf(newMessage.message.m_id) != -1) {
                    return false;
                }
            }
            let _message = {
                ...newMessage.message,
                payload: newMessage.message.payload ?? [],
                attachments: newMessage.message.attachments,
                fallback: newMessage.message.fallback,
                _id: Math.floor(Math.random() * 10000),
                text: newMessage.message.message ? newMessage.message.message : '',
                image: newMessage.message?.albums?.length > 0 ? newMessage.message.albums[0] : '',
                blockButton: newMessage?.message?.buttons ?? [],
                error_text: newMessage?.message?.error_text ?? '',
                createdAt: moment().format(),
                user: newMessage.message.is_Page_Reply ? {
                    _id: newMessage.message.page_id,
                    avatar: page?.avatar
                } : {
                    _id: newMessage.message.sender?.sender_id,
                },
            }
            this.setState(previousState => ({
                messages: GiftedChat.append(previousState.messages, [_message])
            }))
        }
    }

    deselectImage = () => {
        this.setState({ image_selected: {} })
    }



    choosePhoto = async () => {
        await this.closeImageActionSheet()
        this.setState({ image_loading: true })
        setTimeout(() => {
            ImagePicker.openPicker({
                multiple: true,
                includeBase64: true,
                mediaType: 'photo',
                maxFiles: 10,
            }).then(images => {
                this.setState({ image_loading: false })
                if (images?.length > 0) {
                    for (let image of images) {
                        this.sendImage(image)``
                    }
                }
            }).catch(err => {
                this.setState({ image_loading: false })
            })
        }, 500);


    }

    requestChoosePhoto = () => {
        const permission = Platform.OS == 'ios' ? PERMISSIONS.IOS.CAMERA : PERMISSIONS.ANDROID.CAMERA
        check(permission).then(result => {
            if (result == RESULTS.GRANTED || result == RESULTS.LIMITED) {
                this.choosePhoto()
            } else {
                if (Platform.OS == 'ios') {
                    // openSettings()
                    request(permission).then(response => {
                        if (response == RESULTS.GRANTED || result == RESULTS.LIMITED) {
                            this.choosePhoto()
                        }
                    })
                } else {
                    request(permission).then(response => {
                        if (response == RESULTS.GRANTED || result == RESULTS.LIMITED) {
                            this.choosePhoto()
                        }
                    })
                }
            }
        })
    }

    requestTakePhoto = () => {
        const permission = Platform.OS == 'ios' ? PERMISSIONS.IOS.CAMERA : PERMISSIONS.ANDROID.CAMERA
        check(permission).then(result => {
            if (result == RESULTS.GRANTED) {
                this.takePhoto()
            } else {
                if (Platform.OS == 'ios') {
                    // openSettings()
                    request(permission).then(response => {
                        if (response == RESULTS.GRANTED) {
                            this.takePhoto()
                        }
                    })
                } else {
                    request(permission).then(response => {
                        if (response == RESULTS.GRANTED) {
                            this.takePhoto()
                        }
                    })
                }
            }
        })
    }

    takePhoto = async () => {
        await this.closeImageActionSheet()
        this.setState({ image_loading: true })
        setTimeout(() => {
            ImagePicker.openCamera({
                writeTempFile: true,
                includeBase64: true,
            }).then(image => {
                this.setState({ image_loading: false })
                this.sendImage(image)
            }).catch(err => {
                this.setState({ image_loading: false })
            })
        }, 500);
    }

    selectFile = async () => {
        const { sender_id, sender_name } = app_config.sender_data
        const conv = this.props.navigation.getParam('conv')
        const conv_id = conv._id
        try {
            this.setState({ image_loading: true })
            const file = await DocumentPicker.pickSingle()
            await this.closeImageActionSheet()
            this.setState({ image_loading: false })
            if (file?.uri?.length > 0) {
                const result = await upLoadFile(conv_id, file)
                const { data } = result ?? {}
                if (data) {
                    const { orig_name, file_size, full_path } = data ?? {}
                    const url = full_path.replace('/www/wwwroot/', 'https://')
                    const attachment = {
                        name: orig_name,
                        size: file_size,
                        url,
                    }
                    let _message = {
                        _id: Math.floor(Math.random() * 10000),
                        text: 'Tệp đính kèm',
                        attachments: [attachment],
                        createdAt: moment().format(),
                        user: {
                            _id: sender_id,
                            name: sender_name
                        },
                    }
                    this.setState(previousState => ({
                        messages: GiftedChat.append(previousState.messages, [_message]),
                        messageText: ''
                    }))
                    this._sendToFchat('', null, attachment)
                }
            }
        } catch (error) {
            console.error('SELECT FILE ERROR: ', error)
            this.setState({ image_loading: false })
            await this.closeImageActionSheet()
        }
    }

    openImageActionSheet = async () => {
        await SheetManager.show(action_sheet_id)
    }

    closeImageActionSheet = async () => {
        await SheetManager.hide(action_sheet_id)
    }

    renderActionSheet = () => {
        return <ActionSheet id={action_sheet_id}>
            <View style={{ width, paddingBottom: 40, alignItems: 'center', paddingTop: 30 }}>
                <TouchableOpacity onPress={this.selectFile}>
                    <View style={{ width, alignItems: 'center' }}>
                        <Text style={{ marginVertical: 20, fontWeight: 'bold', fontSize: 16 }}>Chọn file</Text>
                    </View>
                </TouchableOpacity>
                <TouchableOpacity onPress={this.requestTakePhoto}>
                    <View style={{ width, alignItems: 'center' }}>
                        <Text style={{ marginVertical: 20, fontWeight: 'bold', fontSize: 16 }}>Chụp ảnh</Text>
                    </View>
                </TouchableOpacity>
                <TouchableOpacity onPress={this.requestChoosePhoto}>
                    <View style={{ width, alignItems: 'center' }}>
                        <Text style={{ marginVertical: 20, fontWeight: 'bold', fontSize: 16 }}>Chọn ảnh từ thư viện</Text>
                    </View>
                </TouchableOpacity>
            </View>
        </ActionSheet>
    }

    onTextSubmit = () => {
        let { messageText, image_selected } = this.state
        const str = messageText.trim()
        if (image_selected?.path?.length > 0 && str?.length == 0) {

        } else {
            this._doChatText()
        }
        if (image_selected?.path?.length > 0) {
            this.sendImage()
        }
    }

    onChangeText = (text) => {
        this.setState({ messageText: text })
    }

    _renderInputChat = () => {
        const { conv, expandToolChat, image_selected, image_loading, heightInputChat } = this.state;
        return (
            <View style={[{ height: 75, borderTopColor: 'silver', borderTopWidth: StyleSheet.hairlineWidth, backgroundColor: 'white', }]}>

                <View style={{ height: 75, width: '100%', flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 10, }}>
                    <View style={{ flex: image_selected?.path?.length > 0 ? 3 : 1, alignItems: 'center', justifyContent: 'center' }}>
                        {image_loading ? <ActivityIndicator color={colors.brand_color} size='small' />
                            : <TouchableOpacity onPress={this.openImageActionSheet} hitSlop={{ top: 10, left: 10, bottom: 10, right: 10 }}>
                                <Image source={require('../assets/images/attach.png')} style={{ width: 25, height: 25, marginBottom: 5 }} resizeMode="contain" />
                                {/* <Image source={require('../assets/images/image.png')} style={{ width: 25, height: 25 }} resizeMode="contain" /> */}
                            </TouchableOpacity>
                        }
                    </View>

                    <View style={{ flex: 6, }}>
                        <TextInput
                            multiline={true}
                            ref={ref => this.chat_input = ref}
                            numberOfLines={4}
                            returnKeyType='default'
                            style={[{ height: 70, overflow: 'hidden', padding: 15, borderColor: 'silver', borderRadius: 20, borderWidth: StyleSheet.hairlineWidth, width: '100%' }]}
                            placeholder="Nhập tin nhắn"
                            onChangeText={this.onChangeText}
                            value={this.state.messageText}
                        />
                    </View>
                    <TouchableOpacity style={{ flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', }} onPress={this.onTextSubmit}>
                        <Image source={require('../assets/images/send.png')} style={{ marginLeft: 10, marginBottom: 5, width: 30, height: 30 }} resizeMode="contain" />
                    </TouchableOpacity>
                </View>
            </View>
        )
    }

    isNotchIphone = () => {
        return (
            Platform.OS === 'ios' &&
            !Platform.isPad &&
            !Platform.isTVOS &&
            (height > 812 || width > 812)
        );
    }

    _onQuickReplyPressed = (item, data_quick) => {
        const { value, title, keyword_content_id } = item
        const conv = this.props.navigation.getParam('conv')
        let conv_id = conv?._id
        const user_id = app_config.sender_data?.sender_id
        const params = {
            block_id: value,
            data_quick,
            keyword_content_id: keyword_content_id,
            page_type: 2,
            quick_value: title,
            user_id,
            conv_id,
        }
        this._sendQuickReply(params)
    }


    _sendQuickReply = async (params) => {
        const result = await sendQucickReply(params)
        const { error } = result ?? {}
        if (!error) {
            await this.deleteDataQuick()
        }
    }

    onBlockButtonPressed = (item) => {
        const { url, type, payload, title } = item
        if (type == 'web_url' && url != '') {
            if (url.includes('fchat.vn/form')) {
                const conv = this.props.navigation.getParam('conv')
                this.props.navigation.navigate('WebViewScreen', { uri: url, conv })
            } else {
                Linking.openURL(url)
            }
        } else if (type == 'postback') {
            if (title) {
                this._sendToFchat(title, null, null, true)
                this.appenTextMessage(title)
            }
            if (payload) {
                this.doSendBlock(payload)
            }
        } else if (type == 'phone_number') {
            Linking.openURL(`tel:${payload}`)
        }
    }

    renderBlockButton = (item, index) => {
        return <View style={{ width: '90%' }} key={index.toString()}>
            <TouchableOpacity onPress={() => { this.onBlockButtonPressed(item) }} >
                <View style={{ paddingHorizontal: 10, paddingVertical: 10, backgroundColor: 'white', borderRadius: 10, marginVertical: 5, alignItems: 'center', justifyContent: 'center' }}>
                    <Text>{item?.title}</Text>
                </View>
            </TouchableOpacity>
        </View>
    }

    renderAttachment = (item, index, text_color) => {
        return <View key={index.toString()} >
            <Text style={{ color: text_color }}>{item.name}</Text>
            <Text style={{ color: text_color }}>{item.size}KB</Text>
        </View>
    }

    _renderTimeAndBlock = ({ currentMessage, position, ...data }) => {
        let blocks = null
        let attachments
        const text_color = position == 'right' ? 'white' : 'black'
        let error_view = <View></View>
        if (currentMessage.error_text && currentMessage.error_text != '') {
            error_view = <View style={{ marginTop: 5 }}>
                <Text style={{ color: 'red', fontSize: 12, padding: 10 }}>{currentMessage.error_text}</Text>
            </View>
        }
        if (currentMessage?.blockButton?.length > 0) {
            blocks = <View style={{ marginVertical: 10, }}>
                <View style={{ width: '100%', alignItems: 'center' }}>
                    {
                        currentMessage.blockButton.map((item, index) => this.renderBlockButton(item, index, text_color))
                    }
                </View>

            </View>
        }
        if (currentMessage?.attachments?.length > 0) {
            attachments = <View style={{ marginVertical: 10 }}>
                <View style={{}}>
                    {
                        currentMessage.attachments.map((item, index) => this.renderAttachment(item, index, text_color))
                    }
                </View>

            </View>
        }
        const chat_by = currentMessage?.is_Page_Reply ? currentMessage?.chat_by?.full_name ? `${currentMessage?.chat_by?.full_name} - ` : 'Bot - ' : ''
        return <View style={{ marginBottom: 10, paddingHorizontal: 10, width: blocks ? '100%' : null }}>
            {attachments}
            {blocks}
            <Text style={{ color: 'silver', fontSize: 12 }}>{chat_by}{moment(currentMessage.createdAt).format('HH:mm')}</Text>
            {error_view}
        </View>
    }

    renderLoadEarlier = () => {
        const { loading } = this.state
        return <LoadEarlier
            label="Tải thêm tin nhắn"
            onLoadEarlier={this.getConversationMessages}
            isLoadingEarlier={loading}
        />
    }

    renderGalleryItem = (text_color, bg_color) => ({ item, index }) => {
        return <View style={{ width: 200, marginLeft: 5, borderRadius: 20, backgroundColor: bg_color, borderColor: 'silver', }}>
            <LightBox
                activeProps={{ flex: 1, resizeMode: 'contain', width }}
            >
                <Image source={{ uri: item.image_url }} style={{ width: 200, height: 200, borderTopLeftRadius: 20, borderTopRightRadius: 20, resizeMode: 'cover', }} />
            </LightBox>
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: text_color, marginTop: 10, marginLeft: 10 }}>{item.title}</Text>
            <Text style={{ color: 'silver', marginTop: 5, marginLeft: 10 }}>{item.subtitle}</Text>
            <View style={{ flex: 1, width: 200, alignItems: 'center', marginBottom: 15, }}>
                {item?.buttons?.length > 0 ? item.buttons.map(this.renderBlockButton) : null}
            </View>
        </View>
    }

    renderCustomView = (msg_props) => {
        const { currentMessage, position } = msg_props
        const { elements } = currentMessage ?? {}
        const text_color = position == 'right' ? 'white' : 'black'
        const bg_color = position == 'right' ? colors.message_right : colors.message_left

        if (elements?.length > 0) {
            return <View style={{ maxHeight: 300, paddingHorizontal: 10 }}>
                <FlatList
                    data={elements}
                    renderItem={this.renderGalleryItem(text_color, bg_color)}
                    horizontal={true}
                    keyExtractor={(item, index) => index.toString()}
                />
            </View>
        }
        return null
    }

    _renderQuickReplyOtions = (item, data_quick) => {
        return <TouchableOpacity onPress={() => { this._onQuickReplyPressed(item, data_quick) }}>
            <View style={{
                backgroundColor: 'white', marginRight: 10, borderRadius: 20, marginTop: 5,
                shadowColor: 'black',
                shadowOffset: { width: 0, height: 3, },
                shadowRadius: 3.84,
                shadowOpacity: 0.5,
                elevation: 5
            }}>
                <Text style={{ paddingHorizontal: 20, paddingVertical: 10 }}>{item.title}</Text>
            </View>
        </TouchableOpacity>
    }

    renderBubble = (msg_props) => {
        const { currentMessage, position } = msg_props
        const { elements, data_quick } = currentMessage ?? {}
        const text_color = position == 'right' ? 'white' : 'black'
        const bg_color = position == 'right' ? colors.message_right : colors.message_left
        const wrapperStyle = {
            left: {
                backgroundColor: bg_color,
            },
            right: {
                backgroundColor: bg_color,
            },
        }

        if (data_quick?.quick?.length > 0) {
            return <View style={{ flexDirection: 'row', width: '80%', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                {data_quick?.quick.map(item => { return this._renderQuickReplyOtions(item, data_quick) })}
            </View>
        }

        if (elements?.length > 0) {
            return <View style={{ paddingTop: 20, }}>
                <FlatList
                    style={{ maxWidth: width * 0.8 }}
                    data={elements}
                    renderItem={this.renderGalleryItem(text_color, bg_color)}
                    horizontal={true}
                    keyExtractor={(item, index) => index.toString()}
                    showsHorizontalScrollIndicator={false}
                />
                <View style={{ marginTop: 5 }}>
                    {this._renderTimeAndBlock(msg_props)}
                </View>
            </View>
        }
        return <Bubble {...msg_props} wrapperStyle={wrapperStyle} />
    }

    goBack = () => {
        this.props.navigation.navigate('Conversations')
    }

    render() {
        const { conv } = this.state
        const { sender_id } = app_config.sender_data ?? {}
        return <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'space-between', }]}>
            <Header goBack={this.goBack} />
            <View style={{ width: '100%', flex: 1, backgroundColor: 'white' }}>
                <GiftedChat
                    messages={this.state.messages}
                    renderTime={this._renderTimeAndBlock}
                    user={{
                        _id: sender_id,
                    }}
                    minInputToolbarHeight={75}
                    renderInputToolbar={this._renderInputChat}
                    bottomOffset={this.isNotchIphone() ? 24 : 0}
                    loadEarlier={this.state.can_load_more}
                    renderLoadEarlier={this.renderLoadEarlier}
                    // renderCustomView={this.renderCustomView}
                    renderBubble={this.renderBubble}
                />
            </View>
            <Footer />
            {this.renderActionSheet()}
        </View>

    }
}

const styles = StyleSheet.create({

})


export default withSocketContext(withPageDataContext(withUserOnlineContext(ConversationDetail)))