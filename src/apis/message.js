
import { getRequest, postRequest } from './baseApi'
import { app_config } from '../utils/app_config'


export const getMessage = (data) => {
    const { page_id, sender_data } = app_config
    const { sender_id } = sender_data ?? {}
    const path = 'webchat/getmessage'
    const params = { page_id, ...data }
    // const params = {
    //     conv_id: 6321947a0365814011040af7,
    //     page: 1,
    //     paging: 20,
    // }
    return getRequest(path, params)
}

export const sendMessage = (data) => {
    const { page_id } = app_config
    const path = 'webchat/send'
    const params = { page_id, ...data }
    // const params = {
    //     "page_id": "61d6c9b143e79f113e798e72",
    //     "conv_id": "631ebfb78aaf804df714c4c2",
    //     "message": "hello",
    //     "preview_index": "1662959828812_0",
    //     "m_id": 1662959828812
    // }
    return postRequest(path, params)
}

export const sendBlock = (data) => {
    const { page_id } = app_config
    const path = 'webchat/sendblock'
    const params = { page_id, ...data }
    params.page_type = 2
    // const params = {
    //     "page_id": "61d6c9b143e79f113e798e72",
    //     "conv_id": "631ebfb78aaf804df714c4c2",
    //     "block_id": "624bd0ddddc2d05fb558ae5e",
    //     "page_type": 2,
    //     "user_id": "628b103e0e450726a670d8f2"
    // }
    return postRequest(path, params)
}

export const sendInput = (data) => {
    const { page_id } = app_config
    const path = 'https://fchat.vn/api_v1/webchat/sendInput'
    const params = { page_id, ...data }
    // const params = {
    //     "page_id": "6368cb42225f425806097887",
    //     "conv_id": "638abcd67c1e9a68a6582224",
    //     "message": "", //text gửi đi
    //     "data_userinputnext": "LocalStorage"

    // }
    return postRequest(path, params)
}

export const sendQucickReply = (data) => {
    const { page_id } = app_config
    const path = 'https://fchat.vn/api_v1/webchat/sendQuick'
    const params = { page_id, ...data }
    return postRequest(path, params)
}

export const upLoadFile = async (conv_id, file) => {
    try {
        const url = 'https://fchat.vn/api_v1/webchat/do_uploadfile'
        const formdata = new FormData()
        formdata.append('file', file)
        formdata.append('conv_id', conv_id)
        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'multipart/form-data',
            },
            body: formdata,
        }
        const response = await fetch(url, options)
        const result = await response.json()
        return result
    } catch (error) {
        return error
    }
}