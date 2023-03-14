import AsyncStorage from '@react-native-async-storage/async-storage'
export const storeLocalData = async (key, value) => {
    try {
        await AsyncStorage.setItem(key, JSON.stringify(value))
    } catch (e) {
        return { error: e }
    }
}
export const getLocalData = async (key) => {
    try {
        const value = await AsyncStorage.getItem(key)
        if (value != null) {
            return JSON.parse(value)
        }
        return null
    } catch (e) {
        return { error: e }
    }
}

export const removeLocalData = async (key) => {
    try {
        const value = await AsyncStorage.removeItem(key)
    } catch (e) {
        return { error: e }
    }
}