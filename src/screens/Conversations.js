import React, { PureComponent } from "react"
import { Dimensions, StyleSheet, TouchableOpacity, View, Text, Image, FlatList, ActivityIndicator } from "react-native"
import Header from "../../src/components/Header"
import Footer from "../../src/components/Footer"
import { listConversation, newConversation } from '../apis/conversation'
import { app_config } from "../utils/app_config"
import { withPageDataContext } from "../context/PageContext"
import { withUserOnlineContext } from "../context/UserOnlineContext"
import { withSocketContext } from "../context/SocketContext"
import { withCustomerContext } from "../context/CustomerContext"
import { colors, socketUtils } from "../utils/constant"
import moment from 'moment'



const { width, height } = Dimensions.get('window')

class Conversations extends PureComponent {

    constructor(props) {
        super(props)
        this.state = {
            loading: false,
            conv: [],
            create_loading: false,
        }
    }

    getConversations = async () => {
        const { sender_id } = app_config?.sender_data ?? {}
        if (sender_id && sender_id != '') {
            const result = await listConversation(sender_id)
            const { error, conv } = result ?? {}
            if (!error && conv) {
                this.setState({ conv })
            }
        }
    }

    createNewConversation = async () => {
        const { create_loading } = this.state
        if (!create_loading) {
            this.setState({ create_loading: true })
            const { sender_id } = app_config.sender_data ?? {}
            const { customerId } = this.props
            const params = {
                sender_id,
                customer_id: customerId,
            }
            const result = await newConversation(params)
            this.setState({ create_loading: false })
            const { error, datas, conv_id } = result ?? {}
            if (!error && datas) {
                const conv_data = { ...datas, _id: conv_id }
                this.setState({ conv: [...this.state.conv, conv_data] })
                this.goToConversationDetail(conv_data, { send_greeting: true })
            }
        }

    }

    goToConversationDetail = (item) => {
        this.props.navigation.navigate('ConversationDetail', { conv: item })
    }


    removeSocketListener = () => {
        this.props.socket.off(socketUtils.newMessage, this._handleNewMessage);
        this.props.socket.off(socketUtils.receiveMessage, this._handleNewMessage);
    }

    addSocketListener = async () => {
        this.props.socket.on(socketUtils.newMessage, this._handleNewMessage);
        this.props.socket.on(socketUtils.receiveMessage, this._handleNewMessage);
    }

    componentDidMount = () => {
        this.getConversations()
        this.addSocketListener()
    }

    componentWillUnmount = () => {
        this.removeSocketListener()

    }

    _handleNewMessage = (message_data) => {
        const { conversation, message } = message_data ?? {}
        const conversations = [...this.state.conv]
        const { sender_id } = app_config.sender_data
        if (conversation && conversation.sender_id == sender_id) {
            if (message?.message) {
                conversation.last_mess = {
                    created_at: message?.created_at ?? moment().format(),
                    message: message.message && message.message != '' ? message.message : 'Tệp đính kèm',
                    is_page_reply: message.is_page_reply,
                    _id: message._id
                }
            }
            const { _id } = conversation ?? {}
            const index = conversations.findIndex(e => e._id == _id)
            if (index != -1) {
                conversations.splice(index, 1)
                conversations.unshift(conversation)
            } else {
                conversations.unshift(conversation)
            }
        }
        this.setState({ conv: conversations })
    }

    renderStatus = (item) => {
        let color = colors.open_conversation
        let text = 'Đang mở'
        if (item.is_done) {
            color = 'black'
            text = 'Đã hoàn thành'
        }
        return <Text style={{ fontSize: 12, color: color }}>{text}</Text>
    }

    renderConversationItem = ({ item }) => {
        const { avatar, updated_at, sale_name, sale_avatar, last_mess } = item
        const { page, settings } = this.props.pageData ?? {}
        const { message } = last_mess ?? {}
        return <TouchableOpacity onPress={() => { this.goToConversationDetail(item) }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', width: width * 0.8, marginVertical: 10 }}>
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                    <Image style={{ width: 50, height: 50, borderRadius: 25 }} source={{ uri: sale_avatar ?? page?.avatar }} />
                </View>
                <View style={{ flex: 5 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <View style={{ flex: 3, marginLeft: 5 }}><Text style={{ fontWeight: 'bold', }}>{sale_name ?? page?.name}</Text></View>
                        <View style={{ flex: 2, alignItems: 'flex-end' }}><Text style={{ fontSize: 12, color: '#5f5f5f' }}>{moment(updated_at).format('DD/MM HH:mm')}</Text></View>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 5 }}>
                        <View style={{ flex: 3, marginLeft: 5 }}><Text numberOfLines={1} style={{ fontSize: 12, color: '#5f5f5f' }}>{message != null && message != '' ? message : 'Tệp đính kèm'}</Text></View>
                        <View style={{ flex: 2, alignItems: 'flex-end' }}>{this.renderStatus(item)}</View>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    }


    renderUserOnline = (user, index) => {
        return <Image key={index.toString()} style={{ width: 40, height: 40, borderRadius: 20, marginLeft: -10, borderWidth: StyleSheet.hairlineWidth, borderColor: 'silver' }} source={{ uri: user.avatar }} />
    }

    render() {
        const { page, settings } = this.props.pageData ?? {}
        const users = this.props.onlineUsers ?? []
        const { conv, create_loading } = this.state
        return <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'space-between', }]}>
            <Header />
            <View style={{ width: '100%', flex: 1, alignItems: 'center' }}>
                <FlatList
                    data={conv}
                    renderItem={this.renderConversationItem}
                    keyExtractor={(item, index) => index.toString()}
                    showsVerticalScrollIndicator={false}
                // contentContainerStyle={{alignItems:'center'}}
                />
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                    <TouchableOpacity onPress={this.createNewConversation}>
                        <View style={{ flexDirection: 'row', height: 40, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20, backgroundColor: colors.brand_color, borderRadius: 20, marginLeft: 10, marginTop: 5 }}>
                            {create_loading?<ActivityIndicator size='small' color='silver' />
                            :<>
                                <Text style={{ color: 'white', }}>Phiên chat mới</Text>
                                <Image style={{ width: 10, height: 10, marginLeft: 10 }} source={require('../assets/images/chevron-right.png')} />
                            </>}
                        </View>
                    </TouchableOpacity>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', paddingHorizontal: 10, marginHorizontal: 10 }}>
                        {users.map(this.renderUserOnline)}
                    </View>
                </View>
            </View>
            <Footer />
        </View>

    }
}

const styles = StyleSheet.create({

})


export default withSocketContext(withPageDataContext(withUserOnlineContext(withCustomerContext(Conversations))))