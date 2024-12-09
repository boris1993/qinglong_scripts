// [task_local]
// 水龙头app签到
// 0 8 * * *

const fetch = require('node-fetch');

const BASE_URL = 'https://shuilongtouapp.com';
const AUTH_CURRENT_URL = `${BASE_URL}/api/v1/auth/current`;

const SHUILONGTOU_TOKEN = process.env.SHUILONGTOU_TOKEN;
const QINGLONG_CLIENT_ID = process.env.QINGLONG_CLIENT_ID;

async function main() {
    if (!shuilongtouToken) {
        console.error("水龙头app token未设定");
        return;
    }

    const response = await fetch(AUTH_CURRENT_URL, {
        method: 'put',
        headers: {
            'Authorization': `Bearer ${shuilongtouToken}`,
            'versionName': '1.5.97',
            'platform': 'iOS',
            'x-app-refer': 'exin'
        }
    });

    const responseData = await response.json();

    const statusCode = responseData['code'];
    if (statusCode !== 0) {
        const errorMessage = responseData['message'];
        throw new Error(errorMessage);
    }

    const data = responseData['data'];
    const token = data['token'];
    const expiresAt = data['expiresAt'];
}
