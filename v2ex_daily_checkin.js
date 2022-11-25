// [task_local]
// V2EX每日签到
// 10 8 * * * v2ex_daily_checkin.js, tag=V2EX每日签到, enabled=true
const axios = require("axios");

const COOKIE = process.env.V2EX_COOKIE;
const CHECKIN_URL = "https://www.v2ex.com/mission/daily";
const REDEEM_COIN_URL = "https://www.v2ex.com/mission/daily/redeem?once=";

const ALREADY_CHECKED_IN_MESSAGE = "每日登录奖励已领取";
const CHECKIN_SUCCESSFUL_MESSAGE = '已成功领取每日登录奖励';

if (!COOKIE) {
    console.error("缺少环境变量V2EX_COOKIE");
    return;
}

let headers = {
    Cookie: COOKIE,
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/107.0.0.0 Safari/537.36',
    Referer: 'https://www.v2ex.com/',
    'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
    'accept-encoding': 'gzip, deflate, br',
    'accept-language': 'zh-CN,zh;q=0.9,en-US;q=0.8,en;q=0.7',
    'cache-control': 'no-cache',
    'Content-Type': 'text/html;charset=utf-8',
}

async function doSignIn() {
    console.log('正在获取redeem URL');

    let returnedHtml = await axios
        .get(CHECKIN_URL, { headers })
        .then((response) => {
            console.log(response);
            console.log("==========================");
            return response.data;
        })
        .catch((error) => {
            console.log(error);
            return;
        });

    console.log(returnedHtml);

    if (returnedHtml.indexOf(ALREADY_CHECKED_IN_MESSAGE) !== -1) {
        console.log(ALREADY_CHECKED_IN_MESSAGE);
        return;
    }

    let redeemUrl = returnedHtml.match(/\/mission\/daily\/redeem\?once=\d+/)[0];
    let once = redeemUrl.match(/\d+/)[0];

    if (!once) {
        console.error('从redeem URL中获取once失败');
        return;
    }

    console.log(`Redeem URL是${redeemUrl}`);
    console.log(`once是${once}`);

    let redeemUrlWithOnce = `${REDEEM_COIN_URL}${once}`;
    headers['Referer'] = 'https://www.v2ex.com/mission/daily';

    console.log(`签到URL是${redeemUrlWithOnce}`);

    returnedHtml = await axios
        .get(redeemUrlWithOnce, { headers })
        .then((response) => {
            return response;
        })
        .catch((error) => {
            console.error(error);
            return;
        });

    if (returnedHtml && returnedHtml.indexOf(CHECKIN_SUCCESSFUL_MESSAGE) !== -1) {
        console.log(CHECKIN_SUCCESSFUL_MESSAGE);
    }
}

doSignIn();
