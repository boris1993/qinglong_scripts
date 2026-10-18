// [task_local]
// 巴哈姆特签到
// 0 10 * * * bahamut.js, tag=巴哈姆特签到, enabled=true

const fetch = require("node-fetch");
const speakeasy = require("speakeasy");
const { HttpsProxyAgent } = require("https-proxy-agent");

const username = process.env.BAHAMUT_USERNAME;
const password = process.env.BAHAMUT_PASSWORD;
const totp = process.env.BAHAMUT_TOTP;

async function main() {
    if (!username || !password || !totp) {
        throw new Error("Username or password or TOTP key not set");
    }

    const proxyUrl = process.env.http_proxy || process.env.https_proxy;
    if (proxyUrl) {
        proxyAgent = new HttpsProxyAgent(proxyUrl);
        nodeFetchOptions.agent = proxyAgent;
    }

    const rune = await login();
    await checkIn(rune);
}

async function login() {
    console.log(`正在登录巴哈姆特, 用户名: ${username}`);

    const resp = await fetch(
        "https://api.gamer.com.tw/mobile_app/user/v3/do_login.php",
        {
            method: "POST",
            headers: {
                "User-Agent": "Bahadroid (https://www.gamer.com.tw/)",
                Cookie: "ckAPP_VCODE=7045",
            },
            body: new URLSearchParams({
                uid: username,
                passwd: password,
                twoStepAuth: speakeasy.totp({
                    secret: totp,
                    encoding: "base32",
                }),
                vcode: "7045",
            }),
        },
    );

    const body = await resp.json();
    if (body.message) {
        throw new Error(body.message);
    }

    const runeCookie = await resp.headers.raw()["set-cookie"].find((cookie) => cookie.startsWith("BAHARUNE"));
    if (!runeCookie) {
        throw new Error("Login failed, no cookie returned");
    }

    return runeCookie.split(";")[0];
}

async function checkIn(rune) {
    console.log("正在签到");

    const csrfTokenResp = await fetch(
        "https://www.gamer.com.tw/ajax/get_csrf_token.php",
        {
            headers: {
                "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
                Cookie: `${rune}`,
            }
        }
    );
    const csrfToken = await csrfTokenResp.text();
    if (!csrfToken) {
        throw new Error("获取CSRF token失败");
    }

    const resp = await fetch(
        "https://www.gamer.com.tw/ajax/signin.php",
        {
            method: "POST",
            headers: {
                "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
                Cookie: `${rune}`,
            },
            body: new URLSearchParams({
                action: 1,
                token: csrfToken,
            }),
        }
    );

    const body = await resp.json();
    console.log(body);

    if (body.data) {
        console.log(`签到成功，已连续签到${body.data.days}天`);
    } else if (body.error && body.error.code === 8892) {
        // 已经签到过，不是错误
        console.log(body.error.message);
    } else {
        const failMsg = body.error ? body.error.message : null;
        throw new Error(`签到失败: ${failMsg || body.message || "未知错误"}`);
    }
}

main().catch((error) => {
    console.error("Error occurred:", error);
    process.exitCode = 1;
});
