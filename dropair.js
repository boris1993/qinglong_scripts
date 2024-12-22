// [task_local]
// dropair签到
// 0 12 * * * crypto-coin-apr.js, tag=定时同步加密货币APR到InfluxDB, enabled=true

const fetch = require('node-fetch');

async function main() {
    const tokensStr = process.env.DROP_AIR_TOKENS;
    if (!tokensStr) {
        console.error("DROP_AIR_TOKENS not set");
        return;
    }

    const tokens = tokensStr.split(',');
    for (const token of tokens) {
        const username = extractUsername(token);
        console.log(`Signing in for ${username}`);

        const response = await fetch('https://dropair.io/api/tasks', {
            method: 'POST',
            headers: {
                'Cookie': `auth-token=${token}`,
                'Origin': 'https://dropair.io',
                'User-Agent': 'Mozilla/5.0 (Linux; Android 11; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.210 Mobile Safari/537.36',
                'Referer': 'https://dropair.io/',
            },
            body: JSON.stringify({
                'taskId': 'daily-task'
            }),
        });
        const status = response.status;
        if (status !== 200) {
            console.error(`Check in failed for ${username}, status: ${status}`);
        }
    }
}

function extractUsername(token) {
    const parts = token.split('.');
    const body = parts[1];
    const bodyJson = Buffer.from(body, 'base64').toString();
    const username = JSON.parse(bodyJson).username;
    return username;
}

main().catch(e => {
    console.error(e);
}).finally(() => {
    console.log('done');
});
