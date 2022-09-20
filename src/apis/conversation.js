import {getRequest, postRequest} from './baseApi'
import {app_config} from '../utils/app_config'


export const listConversation =(sender_id)=>{
    const path = 'webchat/getconvsation'
    const params = {
        sender_id,
    }
    return getRequest(path, params)
}

export const getUserOnline =()=>{
    const {page_id} = app_config
    const path = 'webchat/useronline'
    const params = {
        page_id
    }
    return postRequest(path, params)
}

export const sendGreeting =(data)=>{
    const {page_id} = app_config
    const path = 'webchat/sendgreeting'
    const params = {page_id, ...data}
    params.block_id = ''
    // const params = {
    //     "page_id": "61d6c9b143e79f113e798e72",
    //     "conv_id": "631ebfb78aaf804df714c4c2",
    //     "user_id": "628b103e0e450726a670d8f2",
    //     "block_id": ""
    // }
    return postRequest(path, params)
}

export const sendPing =(data)=>{
    const path = 'webchat/sendping'
    const params = {...data}
    return postRequest(path, params)
}

export const updateRead =(data)=>{
    const {page_id} = app_config
    const path = 'webchat/updateread'
    const params = {page_id, ...data}
    // const params = {
    //     "convsation_id": "631ebfb78aaf804df714c4c2",
    //     "is_read": true
    // }
    return postRequest(path, params)
}

export const createConversation =(data)=>{
    const {page_id} = app_config
    const url = 'https://fchat.vn/api_v1/webchat/createConv'
    const params = {page_id, ...data}
    // const params = {
    //     "page_id": "61d6c9b143e79f113e798e72",
    //     "sender_name": "An Nguyen",
    //     "email": "nguyenduybinh002@gmail.com",
    //     "phone": "0945001618",
    //     "lastmess": null,
    //     "ref": null,
    //     "src": null,
    //     "crmid": null,
    //     "url": null,
    //     "title": null
    // }
    return postRequest(url, params)
}

export const newConversation =(data)=>{
    const {page_id} = app_config
    const path = 'https://fchat.vn/api_v1/webchat/newConv'
    const params = {page_id, ...data}
    // const params = {
    //     "page_id": "61d6c9b143e79f113e798e72",
    //     "sender_id": "628b103e0e450726a670d8f2",
    // }
    return postRequest(path, params)
}

