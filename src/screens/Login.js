import React, { PureComponent } from "react"
import { Dimensions, StyleSheet, TouchableOpacity, View, Text, Image, TextInput } from "react-native"
import Header from "../components/Header"
import Footer from "../components/Footer"
import { withPageDataContext } from "../context/PageContext"
import { withUserOnlineContext } from "../context/UserOnlineContext"
import { colors } from '../utils/constant'
import { createConversation } from '../apis/conversation'
import { app_config } from "../../src/utils/app_config"
import { storeLocalData, getLocalData } from '../utils/async_storage'




const { width, height } = Dimensions.get('window')

class Login extends PureComponent {

    constructor(props) {
        super(props)
        this.state = {
            sender_name: '',
            email: '',
            phone: '',
            loading: false,
            error: '',
        }
    }

    createConversation = () => {
        const { sender_name, email, phone, loading } = this.state
        if (!loading) {
            this.setState({ loading: true }, async () => {
                const params = {
                    sender_name, email, phone
                }
                const result = await createConversation(params)
                this.setState({ loading: false }, async () => {
                    const { datas, conv_id, error, sender_id } = result ?? {}
                    if (!error && conv_id && datas, sender_id) {
                        this.setState({ error: '' })
                        app_config.sender_data = {
                            sender_name, email, phone, sender_id
                        }
                        await storeLocalData('sender_data', { sender_name, email, phone, sender_id })
                        this.goToConversationDetail({ conv_id, sender_id, datas })
                    } else {
                        this.setState({ error: error })
                    }
                })
            })
        }
    }

    goToConversationDetail = async (data) => {
        const { conv_id, sender_id, datas } = data ?? {}
        const conv_data = { ...datas, _id: conv_id }
        await this.props.navigation.navigate('Main')
        this.props.navigation.navigate('ConversationDetail', { conv: conv_data })
    }

    renderUserOnline = (user, index) => {
        return <Image key={index.toString()} style={{ width: 40, height: 40, borderRadius: 20, marginHorizontal: 5 }} source={{ uri: user.avatar }} />
    }

    onChangeText = (value, key) => {
        this.setState({ [key]: value })
    }

    renderInput = (key, placeholder) => {
        return <TextInput
            placeholder={placeholder}
            value={this.state[key]}
            onChangeText={value => { this.onChangeText(value, key) }}
            style={{ width: '90%', height: 60, padding: 20, marginVertical: 10, borderRadius: 30, borderColor: 'silver', borderWidth: 1 }}
        />
    }

    render() {
        const { page, settings } = this.props.pageData ?? {}
        const users = this.props.onlineUsers ?? []
        const { error } = this.state
        return <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'space-between', }]}>
            <Header />
            <View style={{ width: '100%', flex: 1, alignItems: 'center' }}>
                <Text style={{ textAlign: 'center', marginVertical: 20, lineHeight: 20 }}>{settings?.welcome}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    {users.map(this.renderUserOnline)}
                </View>
                {this.renderInput('sender_name', 'T??n c???a b???n')}
                {this.renderInput('email', 'Email c???a b???n')}
                {this.renderInput('phone', 'S??? ??i???n tho???i')}
                <TouchableOpacity style={{ width: '100%', alignItems: 'center' }} onPress={this.createConversation}>
                    <View style={{ width: '90%', height: 60, backgroundColor: colors.brand_color, marginVertical: 20, borderRadius: 30, alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ color: 'white', fontWeight: 'bold' }}>B???t ?????u chat</Text>
                    </View>
                </TouchableOpacity>
                <Text style={{ color: 'red', fontSize: 12 }}>{error && error != '' ? `*${error}` : ''}</Text>

            </View>
            <Footer />
        </View>

    }
}

const styles = StyleSheet.create({

})


export default withPageDataContext(withUserOnlineContext(Login))