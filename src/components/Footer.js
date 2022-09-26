import React, { PureComponent } from "react"
import { Dimensions, StyleSheet, TouchableOpacity, View, Text, Linking } from "react-native"
import { colors } from "../utils/constant"




const { width, height } = Dimensions.get('window')

class Footer extends PureComponent {

    goToFchat=()=>{
        Linking.openURL('https://fchat.vn')
    }

    render() {
        return <View style={{ width: '100%', alignItems: 'center' }}>
            <TouchableOpacity onPress={this.goToFchat}>
                <Text style={{ marginVertical: 10, }}>Powered by <Text style={{ color: colors.brand_color }}>fchat.vn</Text></Text>
            </TouchableOpacity>
        </View>

    }
}

const styles = StyleSheet.create({

})


export default Footer