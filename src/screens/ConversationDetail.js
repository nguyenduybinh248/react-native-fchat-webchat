import React, { PureComponent } from "react"
import { Dimensions, StyleSheet, TouchableOpacity, View, Text, Image, FlatList, TextInput, ActivityIndicator, Platform, Linking } from "react-native"
import Header from "../../src/components/Header"
import Footer from "../../src/components/Footer"
import { listConversation, sendPing } from '../apis/conversation'
import { getMessage, sendBlock, sendMessage, upLoadFile } from '../apis/message'
import { sendGreeting } from '../apis/conversation'
import { app_config } from "../utils/app_config"
import { withPageDataContext } from "../context/PageContext"
import { withUserOnlineContext } from "../context/UserOnlineContext"
import { withSocketContext } from "../context/SocketContext"
import { colors, socketUtils } from "../utils/constant"
import moment from 'moment'
import { GiftedChat, Bubble, } from 'react-native-gifted-chat'
import ImagePicker from 'react-native-image-crop-picker'
import { check, PERMISSIONS, RESULTS, request } from 'react-native-permissions'
import ActionSheet, { SheetManager } from 'react-native-actions-sheet'



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
    }

    sendGreeting=async()=>{
        const conv = this.props.navigation.getParam('conv')
        const conv_id = conv._id
        const {sender_id} = app_config.sender_data ?? {}
        const params = {conv_id, sender_id}
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
                }else{
                    if(this.paging == 1){
                        this.sendGreeting()
                    }
                    this.setState({
                        can_load_more: false
                    })
                }
            })
        })
    }

    sendBlock = async (block_id) => {
        let conv_id = this.state.conv?._id
        const user_id = app_config.sender_data?.sender_id
        const params = {
            conv_id,
            user_id,
            block_id,
        }
        const result = await sendBlock(params)
    }

    _sendToFchat = async (message = '', image, image_type = 'base_64') => {
        let { conv } = this.state
        let params = {
            conv_id: conv._id,
            message: message && message != '' ? message : '👍',
            page_id: conv.page_id,
            m_id: Math.floor(Math.random() * 10000),
        }
        if (image) {
            params.image = image
            params.message = ''
        }
        const result = await sendMessage(params)
        const { error, data_socket, msg } = result ?? {}
        if (error == false && data_socket && data_socket.message?._id) {
            this._cacheMessageId.push(data_socket.message.m_id)
            this.props.socket.emit(socketUtils.webchat, data_socket)
        }
        
    }

    _doChatText = () => {
        let { messageText } = this.state;
        this._sendToFchat(messageText)
        this.appenTextMessage(messageText)

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

    sendPingConversation=async()=>{
        const conv = this.props.navigation.getParam('conv')
        const conversation_id = conv?._id
        const params = {
            conversation_id,
            pingtime: moment().valueOf()
        }
        const result = await sendPing(params)
    }

    componentDidMount = () => {
        this.getConversationMessages()
        this.addSocketListener()
        const send_greeting = this.props.navigation.getParam('send_greeting')
        if(send_greeting){
            this.sendGreeting()
        }
        this.sendPingConversation()
        this.sendping_interval = setInterval(() => {
            this.sendPingConversation()
        }, 5*60*1000);
    }

    componentWillUnmount = () => {
        this.removeSocketListener()
        if(this.sendping_interval){
            clearInterval(this.sendping_interval)
        }
    }


    removeSocketListener = () => {
        this.props.socket.off(socketUtils.newMessage, this._handleNewMessage);
        this.props.socket.off(socketUtils.receiveMessage, this._handleNewMessage);
    }

    addSocketListener = async () => {
        this.props.socket.on(socketUtils.newMessage, this._handleNewMessage);
        this.props.socket.on(socketUtils.receiveMessage, this._handleNewMessage);
    }

    _handleNewMessage = (newMessage) => {
        const { page, settings } = this.props.pageData ?? {}
        let { conv } = this.state;
        if (newMessage?.conversation_id == conv._id || newMessage?.conversation?._id == conv._id) {
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

    openImageActionSheet = async () => {
        await SheetManager.show(action_sheet_id)
    }

    closeImageActionSheet = async () => {
        await SheetManager.hide(action_sheet_id)
    }

    renderActionSheet = () => {
        return <ActionSheet id={action_sheet_id}>
            <View style={{ width, paddingBottom: 40, alignItems: 'center', paddingTop: 30 }}>
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
        const { conv, expandToolChat, image_selected, image_loading } = this.state;
        // return null
        return (
            <View style={[{ height: 75, borderTopColor: 'silver', borderTopWidth: StyleSheet.hairlineWidth, backgroundColor: 'white', }]}>

                <View style={{ height: 75, width: '100%', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, }}>
                    <View style={{ flex: image_selected?.path?.length > 0 ? 3 : 1, alignItems: 'center', justifyContent: 'center' }}>
                        {image_loading ? <ActivityIndicator color={colors.brand_color} size='small' />
                            // : image_selected?.path?.length > 0 ? <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                            //     <View style={{}}>
                            //         <Image style={{width:30, height:30}} source={{ uri: image_selected.path }} />
                            //         <View style={{ position: 'absolute', top: -5, right: -10, width: 20, height: 20, borderRadius: 10, backgroundColor: 'black', opacity: 0.5, alignItems: 'center', justifyContent: 'center' }}>
                            //             {/* <Icon hitSlop={{ top: 5, left: 5, bottom: 5, right: 5 }} onPress={this.deselectImage} type='evil-icon' name="close" size={20} color='white' /> */}
                            //         </View>
                            //     </View>

                            // </View>
                            : <TouchableOpacity onPress={this.openImageActionSheet} hitSlop={{ top: 10, left: 10, bottom: 10, right: 10 }}>
                                <Image source={require('../assets/images/image.png')} style={{ width: 25, height: 25 }} resizeMode="contain" />
                            </TouchableOpacity>
                        }
                    </View>

                    <View style={{ flex: 6, borderRadius: 50, backgroundColor: '#f5f5f5', paddingLeft: 8, paddingRight: 8, marginBottom: 5 }}>
                        <TextInput
                            multiline={true}
                            ref={ref => this.chat_input = ref}
                            numberOfLines={4}
                            returnKeyType='default'
                            style={[{ height: Math.max(38, this.state.heightInputChat), maxHeight: 60, overflow: 'hidden', padding: 15 }]}
                            placeholder="Nhập tin nhắn"
                            onChangeText={this.onChangeText}
                            // onFocus={this.onFocus}
                            // onBlur={this._onExpandChatTool}
                            onContentSizeChange={(event) => {
                                if (this.state.heightInputChat < 70) this.setState({ heightInputChat: event.nativeEvent.contentSize.height })
                            }}
                            value={this.state.messageText}
                        />
                    </View>
                    <TouchableOpacity style={{ flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', }} onPress={this.onTextSubmit}>
                        <Image source={require('../assets/images/send.png')} style={{ marginLeft: 10 }} resizeMode="contain" />
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

    onBlockButtonPressed = (item) => {
        const { url, type, payload, title } = item
        if (type == 'web_url' && url != '') {
            Linking.openURL(url)
        } else if (type == 'postback') {
            if (title) {
                this._sendToFchat(title)
                this.appenTextMessage(title)
            }
            if (payload) {
                this.sendBlock(payload)
            }
        }
    }

    renderBlockButton = (item, index) => {
        return <TouchableOpacity key={index.toString()} onPress={() => { this.onBlockButtonPressed(item) }} >
            <View style={{ paddingHorizontal: 10, paddingVertical: 10, backgroundColor: 'white', borderRadius: 10, marginVertical: 5 }}>
                <Text>{item?.title}</Text>
            </View>
        </TouchableOpacity>
    }

    _renderTimeAndBlock = ({ currentMessage }) => {
        let blocks = null
        let error_view = <View></View>
        if (currentMessage.error_text && currentMessage.error_text != '') {
            error_view = <View style={{ marginTop: 5 }}>
                <Text style={{ color: 'red', fontSize: 12, padding: 10 }}>{currentMessage.error_text}</Text>
            </View>
        }
        if (currentMessage?.blockButton?.length > 0) {
            blocks = <View style={{ marginVertical: 10 }}>
                <View style={{}}>
                    {
                        currentMessage.blockButton.map(this.renderBlockButton)
                    }
                </View>

            </View>
        }
        const chat_by = currentMessage?.is_Page_Reply ? currentMessage?.chat_by?.full_name ? `${currentMessage?.chat_by?.full_name} - ` : 'Bot - ' : ''
        return <View style={{ marginBottom: 10, paddingHorizontal: 10 }}>
            {blocks}
            <Text style={{ color: 'silver', fontSize: 12 }}>{chat_by}{moment(currentMessage.createdAt).format('HH:mm')}</Text>
            {error_view}
        </View>
    }

    renderBubble = (msg) => {
        return <View style={{ width: 100, height: 100, backgroundColor: 'red' }}></View>
        return <Bubble {...msg} />
    }

    render() {
        const { page, settings } = this.props.pageData ?? {}
        const { conv } = this.state
        const { sender_id } = app_config.sender_data ?? {}
        return <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'space-between', }]}>
            <Header type='conversation_detail' />
            <View style={{ width: '100%', flex: 1, backgroundColor: 'white' }}>
                <GiftedChat
                    messages={this.state.messages}
                    renderTime={this._renderTimeAndBlock}
                    user={{
                        _id: sender_id,
                    }}
                    minInputToolbarHeight={75}
                    renderInputToolbar={this._renderInputChat}
                    bottomOffset={this.isNotchIphone() ? 34 : 0}
                    onLoadEarlier={this.getConversationMessages}
                    isLoadingEarlier={this.state.conv_loading}
                    loadEarlier={this.state.can_load_more}
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