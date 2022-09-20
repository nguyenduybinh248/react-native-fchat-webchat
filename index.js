import React, { PureComponent } from 'react'
import { createAppContainer, createSwitchNavigator, NavigationActions } from "react-navigation"
import Modal from 'react-native-modal'

import Login from "./src/screens/Login"
import ConversationDetail from "./src/screens/ConversationDetail"
import Conversations from "./src/screens/Conversations"
import { View, StyleSheet, Image, TouchableOpacity, Animated, PanResponder } from 'react-native'
import { api_urls, colors } from './src/utils/constant'
import { app_config } from './src/utils/app_config'
import { getPageData } from './src/apis/page'
import { getUserOnline } from './src/apis/conversation'
import { PageDataContext } from './src/context/PageContext'
import { UserOnlineContext } from './src/context/UserOnlineContext'
import { SocketContext } from './src/context/SocketContext'
import SocketIOClient from 'socket.io-client/dist/socket.io'
import { getLocalData } from './src/utils/async_storage'




const screens = {
    Conversations,
    ConversationDetail,
};


const Main = createSwitchNavigator(screens)


const switch_navigator = createSwitchNavigator({
    Login,
    Main,
})

const SwitchContainer = createAppContainer(switch_navigator)


class FchatWebchat extends PureComponent {

    constructor(props) {
        super(props)
        this.state = {
            is_open: false,
            page_data: {},
            user_online_list: [],
            socket: null,
        }
    }

    animated = new Animated.ValueXY()

    panResponder = PanResponder.create({
        onMoveShouldSetPanResponder: (evt, gestureState) => {
            return !(gestureState.dx === 0 && gestureState.dy === 0) 
        },
        onPanResponderMove: Animated.event(
            [
                null,
                { dx: this.animated.x, dy: this.animated.y }
            ],
            { useNativeDriver: false }),
        onPanResponderRelease: ()=>{
            this.animated.flattenOffset()
        },
        onPanResponderGrant:()=>{
            this.animated.setOffset({
                x: this.animated.x._value,
                y: this.animated.y._value,
            })
        }
    })

    getPageData = async () => {
        const result = await getPageData()
        const { error, page, settings } = result ?? {}
        if (!error && page && settings) {
            this.setState({ page_data: { page, settings } })
        }
    }

    getUserOnline = async () => {
        const result = await getUserOnline()
        const { error, user_online_list } = result ?? {}
        if (!error && user_online_list) {
            this.setState({ user_online_list })
        }
    }

    getUserInfo = async () => {
        const sender_data = await getLocalData('sender_data')
        if (sender_data != null) {
            app_config.sender_data = sender_data
            if (this.navigation_container?.dispatch) {
                this.navigation_container.dispatch(
                    NavigationActions.navigate({ routeName: 'Conversations' })
                );
            }
        }

    }

    connectSocket = async () => {
        try {
            const _socket = SocketIOClient(api_urls.websocket, { transports: ['websocket'] });
            _socket.on('connect', data => {
                _socket.emit("room", this.props.pageId)
                this.setState({
                    socket: _socket
                })
            })
            // _socket.on('disconnect', data => { console.log('socket disconnected', data) })
        } catch (err) {
        }
    }

    componentDidMount = async () => {
        app_config.page_id = this.props.pageId
        this.getPageData()
        this.getUserOnline()
        this.getUserInfo()
        this.connectSocket()
    }

    openWebChat = () => {
        this.setState({ is_open: true }, async () => {
            await this.getUserInfo()
        })
    }

    closeWebChat = () => {
        this.setState({ is_open: false })
    }

    render() {

        return <Animated.View
            style={[
                styles.fab,
                { ...this.props.styles },
                {
                    transform: [
                        { translateX: this.animated.x },
                        { translateY: this.animated.y },
                    ]
                }
            ]}
            {...this.panResponder.panHandlers}
        >
            <TouchableOpacity onPress={this.openWebChat}>
                <Image source={require('./src/assets/images/message.png')} style={styles.message_img} />
            </TouchableOpacity>
            <Modal
                isVisible={this.state.is_open}
                coverScreen={true}
            >
                <View style={styles.container}>
                    <View style={[StyleSheet.absoluteFill]}>
                        <SocketContext.Provider value={this.state.socket}>
                            <PageDataContext.Provider value={{ pageData: this.state.page_data, closeWebChat: this.closeWebChat }}>
                                <UserOnlineContext.Provider value={this.state.user_online_list}>
                                    <SwitchContainer
                                        ref={ref => this.navigation_container = ref}
                                    />
                                </UserOnlineContext.Provider>
                            </PageDataContext.Provider>
                        </SocketContext.Provider>
                    </View>
                </View>
            </Modal>
        </Animated.View>

    }
}

const styles = StyleSheet.create({
    fab: {
        width: 60,
        height: 60,
        borderRadius: 30,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.brand_color,
        position: 'absolute',
        bottom: 10,
        right: 10,
    },
    message_img: {
        width: 30, height: 30,
    },
    container: {
        backgroundColor: 'white', borderRadius: 10, width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', overflow: 'hidden'
    }
})


export default FchatWebchat







