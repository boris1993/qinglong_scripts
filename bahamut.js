// [task_local]
// 巴哈姆特签到
// 0 0 * * * bahamut.js, tag=巴哈姆特签到, enabled=true

const fetch = require("node-fetch");
const speakeasy = require("speakeasy");
const { HttpsProxyAgent } = require("https-proxy-agent");
const { randomBytes } = require("crypto");

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
    const csrfToken = randomBytes(8).toString("hex");
    await checkIn(rune, csrfToken);
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

    const rune = await resp.headers.raw()["set-cookie"].find((cookie) => cookie.startsWith("BAHARUNE"));
    if (!rune) {
        throw new Error("Login failed, no cookie returned");
    }

    return rune;
}

async function checkIn(rune, csrfToken) {
    console.log("正在签到");
    const resp = await fetch(
        "https://api.gamer.com.tw/user/v1/signin.php",
        {
            method: "POST",
            headers: {
                "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
                "X-Bahamut-Csrf-Token": csrfToken,
                Cookie: `BAHARUNE=${rune}; ckBahamutCsrfToken=${csrfToken}`,
            },
            body: new URLSearchParams({
                action: 1,
            }),
        });

    const data = await resp.json();
    if (data.error.message) {
        throw new Error(`Check-in failed: ${data.error.message}`);
    }

    console.log("每日签到已达成");
}

main().catch((error) => {
    console.error("Error occurred:", error);
    process.exitCode = 1;
});
