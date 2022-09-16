import React, { PureComponent } from 'react'
import { createAppContainer, createSwitchNavigator, NavigationActions} from "react-navigation"
import { createStackNavigator } from "react-navigation-stack"
import { SafeAreaView } from 'react-native-safe-area-context'
import Modal from 'react-native-modal'

import Login from "./src/screens/Login"
import ConversationDetail from "./src/screens/ConversationDetail"
import Conversations from "./src/screens/Conversations"
import { View, Dimensions, StyleSheet, Image, TouchableOpacity } from 'react-native'
import { colors } from './src/utils/constant'
import { app_config } from './src/utils/app_config'
import { getPageData } from './src/apis/page'
import { getUserOnline } from './src/apis/conversation'
import { PageDataContext } from './src/context/PageContext'
import { UserOnlineContext } from './src/context/UserOnlineContext'
import { SocketContext } from './src/context/SocketContext'
import SocketIOClient from 'socket.io-client/dist/socket.io'
import { getLocalData } from './src/utils/async_storage'





const { width, height } = Dimensions.get('window')


const screens = {
    Conversations,
    ConversationDetail,
};


const Main = createSwitchNavigator(screens)
// const Main = createStackNavigator(screens, { headerMode: "none" })


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

    getPageData = async () => {
        const result = await getPageData()
        console.log('result page data', result)
        const { error, page, settings } = result ?? {}
        if (!error && page && settings) {
            this.setState({ page_data: { page, settings } })
        }
    }

    getUserOnline = async () => {
        const result = await getUserOnline()
        console.log('result user online', result)
        const { error, user_online_list } = result ?? {}
        if (!error && user_online_list) {
            this.setState({ user_online_list })
        }
    }

    getUserInfo = async () => {
        const sender_data = await getLocalData('sender_data')
        console.log('get sender data', sender_data)
        const sender_id = '628b103e0e450726a670d8f2'
        if (sender_data != null) {
            app_config.sender_data = sender_data
            if(this.navigation_container?.dispatch){
                this.navigation_container.dispatch(
                    NavigationActions.navigate({ routeName: 'Conversations' })
                  );
            }
            // this.navigation_container.navigate('Conversations')

        }


        // const sender_id = '628b103e0e450726a670d8f2'
        // if (sender_id != null) {
        //     app_config.sender_data.sender_id = sender_id
        // }

    }

    connectSocket = async () => {
        const url = 'https://fchatvn-amazon.salekit.com:4033'
        try {
            const _socket = SocketIOClient(url, { transports: ['websocket'] });
            _socket.emit("room", this.props.pageId)
            this.setState({
                socket: _socket
            })
        } catch (err) {
            console.log('connect socket err', err)
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
        this.setState({ is_open: true },async()=>{
            await this.getUserInfo()
        })
    }

    closeWebChat = () => {
        this.setState({ is_open: false })
    }

    render() {
        return <View style={[styles.fab, { ...this.props.styles }]}>
            <TouchableOpacity onPress={this.openWebChat}>
                <Image source={require('./src/assets/images/message.png')} style={styles.message_img} />
            </TouchableOpacity>
            <Modal
                // isVisible={true}
                isVisible={this.state.is_open}
                // onBackdropPress={this.closeWebChat}
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
        </View>

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







