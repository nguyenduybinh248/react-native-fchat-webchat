
const domain = 'https://fchat-app.salekit.com:4039/api/v1/'

export const postRequest = async (path, params = {}, type='application/json') => {
    const headers = {
        "Content-Type": type
    }
    try {
        const url = path.includes('fchat.vn') ? path : `${domain}${path}`
        console.log('post request', { url, params })
        const options = {
            method: 'POST',
            headers,
            body: JSON.stringify(params),
        }
        const response = await fetch(url, options)
        const result = await response.json()
        console.log('post result', result)
        return result
    } catch (error) {
        console.log('error post request', error)
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
        console.log('get request', { url })
        const response = await fetch(url, {
            method: 'GET',
            headers,
        })
        // console.log('get response', response)
        const result = await response.json()
        console.log('get result', result)
        return result
    } catch (error) {
        console.log('get request error', {path, error})
        return error
    }
}


