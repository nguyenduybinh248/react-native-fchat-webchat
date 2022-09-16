import React, { PureComponent } from "react"
import {Dimensions, StyleSheet, TouchableOpacity, View, Text } from "react-native"
import { colors } from "../utils/constant"




const { width, height } = Dimensions.get('window')

class Footer extends PureComponent {


    render() {
        return <View style={{ width: '100%', alignItems:'center' }}>
        <Text style={{marginVertical:10, }}>Powered by <Text style={{color: colors.brand_color}}>fchat.vn</Text></Text>
    </View>

    }
}

const styles = StyleSheet.create({

})


export default Footer