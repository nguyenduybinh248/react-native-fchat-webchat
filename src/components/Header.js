import React, { PureComponent } from "react"
import { Dimensions, StyleSheet, TouchableOpacity, View, Text, Image, Linking } from "react-native"
import { colors } from "../utils/constant"
import { withPageDataContext } from "../context/PageContext"
import { withUserOnlineContext } from "../context/UserOnlineContext"
import { withNavigation } from 'react-navigation'
import { Header as HeaderNavigation, useHeaderHeight } from 'react-navigation-stack'



const { width, height } = Dimensions.get('window')

class Header extends PureComponent {


    call = () => {
        const phone = this.props.pageData?.settings?.contact_social?.phone?.url
        if (phone && phone != '') {
            Linking.openURL(`tel:${phone}`)
        }
    }

    closeWebChat = () => {
        if (this.props.closeWebChat) {
            this.props.closeWebChat()
        }
    }

    goBack = () => {

        this.props.navigation.navigate('Conversations')
    }

    render() {
        const { page, settings } = this.props.pageData ?? {}
        const phone = settings?.contact_social?.phone?.url
        const header_height = HeaderNavigation.HEIGHT + 20
        return <View style={{width:'100%', height: header_height, justifyContent:'flex-end', backgroundColor: colors.brand_color,}}>
            <View style={{ width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 10, height: 60, borderBottomColor: 'silver', borderBottomWidth: StyleSheet.hairlineWidth }}>
                {this.props.type == 'conversation_detail' ? <TouchableOpacity onPress={this.goBack}>
                    <Image source={require('../assets/images/chevron-left.png')} style={{ width: 20, height: 20, borderRadius: 15, marginRight:10}} />
                </TouchableOpacity> : null}
                <View style={{ flexDirection: 'row', alignItems: 'center', flex:1 }}>
                    <Image source={{ uri: page?.avatar }} style={{ width: 40, height: 40, borderRadius: 20, borderWidth: StyleSheet.hairlineWidth, borderColor: 'silver', backgroundColor: 'white' }} />
                    <View style={{ marginLeft: 10 }}>
                        <Text style={{ color: 'white' }}>{page?.name}</Text>
                        <Text style={{ color: 'white', fontSize: 12, marginTop: 5 }}>{settings?.widget_text}</Text>
                    </View>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' }}>
                    {phone ? <TouchableOpacity onPress={this.call}>
                        <Image source={require('../assets/images/phone.png')} style={{ width: 25, height: 25, borderRadius: 15, marginRight:10 }} />
                    </TouchableOpacity> : null}
                    <TouchableOpacity onPress={this.closeWebChat}>
                        <Image source={require('../assets/images/close.png')} style={{ width: 25, height: 25, marginRight: 5, }} />
                    </TouchableOpacity>
                </View>
            </View>
        </View>

    }
}

const styles = StyleSheet.create({

})


export default withPageDataContext(withUserOnlineContext(withNavigation(Header)))