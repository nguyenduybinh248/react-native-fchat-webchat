import React, { PureComponent } from "react"
import { Dimensions, StyleSheet, TouchableOpacity, View, Text, Linking } from "react-native"
import { colors } from "../utils/constant"
import Header from "../../src/components/Header"
import Footer from "../../src/components/Footer"
import WebView from "react-native-webview"




const { width, height } = Dimensions.get('window')

class WebViewScreen extends PureComponent {

    goToFchat = () => {
        Linking.openURL('https://fchat.vn')
    }

    goBack = () => {
        const conv = this.props.navigation.getParam('conv')
        this.props.navigation.navigate('ConversationDetail', {conv})
    }

    onMessage=({nativeEvent})=>{
        if(nativeEvent?.data == 'close'){
            this.goBack()
        }
    }

    render() {
        const uri = this.props.navigation.getParam('uri')
        console.log('uri', uri)
        return <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'space-between', }]}>
            <Header goBack={this.goBack} />
            <View style={{ width: '100%', flex: 1, backgroundColor: 'white' }}>
                <WebView
                    source={{ uri }}
                    onMessage={this.onMessage}
                />
            </View>
            <Footer />
        </View >


    }
}

const styles = StyleSheet.create({

})


export default WebViewScreen