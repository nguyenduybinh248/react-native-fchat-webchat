import {getRequest} from './baseApi'
import {app_config} from '../utils/app_config'


export const getPageData=()=>{
    const {page_id} = app_config
    const path = 'webchat/getpage'
    const params = {
        page_id,
        // page_id: '61d6c9b143e79f113e798e72',
    }
    return getRequest(path, params)
}