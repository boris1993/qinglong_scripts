// [task_local]
// 定时同步贵金属价格（人民币）到InfluxDB
// */20 * * * * precious_metal_quote.js, tag=定时同步贵金属价格（人民币）到InfluxDB, enabled=true

const fetch = require('node-fetch');
const {HttpsProxyAgent} = require('https-proxy-agent');
const {InfluxDBClient, Point} = require('@influxdata/influxdb3-client');

const iTickForexRealTimeQuoteApi = 'https://api.itick.org/forex/quote?region=GB&code=';
const productCodes = ['XAUCNY', 'XAGCNY'];

const influxDbToken = process.env.INFLUX_DB_TOKEN;
const influxDbBucket = process.env.INFLUX_DB_PRECIOUS_METAL_QUOTE_BUCKET;
const iTickApiToken = process.env.ITICK_API_TOKEN;
const nodeFetchOptions = {
    headers: {
        'accept': 'application/json',
        'token': iTickApiToken
    }
};
let proxyAgent;

async function main() {
    if (!iTickApiToken) {
        throw new Error("iTick API token not set");
    }

    if (!influxDbToken) {
        throw new Error("Influx DB token not set");
    }

    if (!influxDbBucket) {
        throw new Error("Influx DB bucket not set");
    }

    const proxyUrl = process.env.http_proxy || process.env.https_proxy;
    if (proxyUrl) {
        proxyAgent = new HttpsProxyAgent(proxyUrl);
        nodeFetchOptions.agent = proxyAgent;
    }

    const influxDbClient = createInfluxDbClient();
    for (const product of productCodes) {
        await storeQuoteToDatabase(influxDbClient, product);
    }
}

async function storeQuoteToDatabase(influxDbClient, productCode) {
    console.log(`Fetching realtime quote of ${productCode}`);

    const url = `${iTickForexRealTimeQuoteApi}${productCode}`;
    const response = await fetch(url, nodeFetchOptions);
    const responseJson = await response.json();

    const responseCode = responseJson['code'];
    if (responseCode !== 0) {
        console.log(responseCode)
        const errorMessage = responseJson['msg'];
        throw new Error(`Error fetching data code=${responseCode} message=${errorMessage}`);
    }

    // see: https://docs.itick.org/rest-api/forex/forex-quote
    const responseData = responseJson['data'];
    if (!responseData) {
        throw new Error('No data returned');
    }

    const latestQuote = responseData['ld'];
    // Milliseconds to nanoseconds
    const latestTransactionTimestamp = responseData['t'] * 1_000_000;

    console.log('Writing to InfluxDB');
    const point = Point
        .measurement('quote')
        .setTimestamp(latestTransactionTimestamp)
        .setTag('symbol', productCode)
        .setFloatField('quote', latestQuote);
    await influxDbClient.write(point);
}

function createInfluxDbClient() {
    return new InfluxDBClient({
        host: 'https://us-east-1-1.aws.cloud2.influxdata.com',
        token: influxDbToken,
        database: influxDbBucket
    });
}

main().then();
