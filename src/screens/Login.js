import React, { PureComponent } from "react"
import { Dimensions, StyleSheet, TouchableOpacity, View, Text, Image, TextInput, ActivityIndicator } from "react-native"
import Header from "../components/Header"
import Footer from "../components/Footer"
import { withPageDataContext } from "../context/PageContext"
import { withUserOnlineContext } from "../context/UserOnlineContext"
import { withCustomerContext } from "../context/CustomerContext"
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
        const { page, settings } = this.props.pageData ?? {}
        const { form_field } = settings ?? {}
        const { sender_name, email, phone, loading } = this.state
        const { customerId } = this.props
        if (form_field?.name?.enable && form_field?.name?.required && (!sender_name || sender_name.length == 0)) {
            this.setState({ error: 'Vui lòng nhập tên của bạn' })
        } else if (form_field?.email?.enable && form_field?.email?.required && (!email || email.length == 0)) {
            this.setState({ error: 'Vui lòng nhập email của bạn' })
        } else if (form_field?.phone?.enable && form_field?.phone?.required && (!phone || phone.length == 0)) {
            this.setState({ error: 'Vui lòng nhập số điện thoại' })
        } else {
            if (!loading) {
                this.setState({ loading: true, error: '' }, async () => {
                    const params = {
                        sender_name, email, phone, customer_id: customerId
                    }
                    const result = await createConversation(params)
                    this.setState({ loading: false }, async () => {
                        const { datas, conv_id, error, sender_id } = result ?? {}
                        if (!error && conv_id && datas, sender_id) {
                            this.setState({ error: '' })
                            app_config.sender_data = {
                                sender_name, email, phone, sender_id, customer_id: customerId,
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

    renderInput = (key, placeholder, setting) => {
        return <TextInput
            placeholder={placeholder}
            value={this.state[key]}
            onChangeText={value => { this.onChangeText(value, key) }}
            style={{ width: '90%', height: 60, padding: 20, marginVertical: 10, borderRadius: 30, borderColor: 'silver', borderWidth: 1 }}
        />
    }

    render() {
        const { page, settings } = this.props.pageData ?? {}
        const { form_field } = settings ?? {}
        const { email, name, phone } = form_field ?? {}
        const users = this.props.onlineUsers ?? []
        const { error, loading } = this.state
        return <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'space-between', }]}>
            <Header />
            <View style={{ width: '100%', flex: 1, alignItems: 'center' }}>
                <Text style={{ textAlign: 'center', marginVertical: 20, lineHeight: 20, paddingHorizontal: 10 }}>{settings?.welcome}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    {users.map(this.renderUserOnline)}
                </View>
                {name?.enable ? this.renderInput('sender_name', 'Tên của bạn') : null}
                {email?.enable ? this.renderInput('email', 'Email của bạn',) : null}
                {phone?.enable ? this.renderInput('phone', 'Số điện thoại',) : null}
                <TouchableOpacity style={{ width: '100%', alignItems: 'center' }} onPress={this.createConversation}>
                    <View style={{ width: '90%', height: 60, backgroundColor: colors.brand_color, marginVertical: 20, borderRadius: 30, alignItems: 'center', justifyContent: 'center' }}>
                        {loading ? <ActivityIndicator size='small' color='white' /> : <Text style={{ color: 'white', fontWeight: 'bold' }}>Bắt đầu chat</Text>}
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


export default withPageDataContext(withUserOnlineContext(withCustomerContext(Login)))