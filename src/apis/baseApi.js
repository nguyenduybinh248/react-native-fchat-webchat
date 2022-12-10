import { api_urls } from "../utils/constant"

const domain = api_urls.api

export const postRequest = async (path, params = {}, type='application/json') => {
    const headers = {
        "Content-Type": type
    }
    try {
        const url = path.includes('fchat.vn') ? path : `${domain}${path}`
        const options = {
            method: 'POST',
            headers,
            body: JSON.stringify(params),
        }
        const response = await fetch(url, options)
        const result = await response.json()
        return result
    } catch (error) {
        return error
    }
}

export const getRequest = async (path, params = {}, force_url) => {
    const headers = {
        "Content-Type": 'application/json'
    }
    try {
        let url = force_url ?? `${domain}${path}`
        for (let key in params) {
            if (url.includes('?')) {
                url += `&${key}=${params[key]}`
            } else {
                url += `?${key}=${params[key]}`
            }
        }
        const response = await fetch(url, {
            method: 'GET',
            headers,
        })
        const result = await response.json()
        return result
    } catch (error) {
        return error
    }
}


