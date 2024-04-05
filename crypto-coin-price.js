// [task_local]
// 定时同步加密货币价格到InfluxDB
// */15 * * * * crypto-coin-price.js, tag=定时同步加密货币价格到InfluxDB, enabled=true

const fetch = require('node-fetch');
const {HttpsProxyAgent} = require('https-proxy-agent');
const {InfluxDBClient, Point} = require('@influxdata/influxdb3-client');

const coinPriceApi = 'https://www.binance.com/api/v3/ticker/price';

const coinPriceSymbols = process.env.COIN_PRICE_SYMBOLS || '';
const influxDbToken = process.env.INFLUX_DB_TOKEN;
const influxDbBucket = process.env.INFLUX_DB_BUCKET;
const nodeFetchOptions = {};

let proxyAgent;

async function main() {
    if (!influxDbToken) {
        console.error("Influx DB token not set");
        return;
    }

    if (!influxDbBucket) {
        console.error("Influx DB bucket not set");
        return;
    }

    const proxyUrl = process.env.http_proxy || process.env.https_proxy;
    if (proxyUrl) {
        proxyAgent = new HttpsProxyAgent(proxyUrl);
        nodeFetchOptions.agent = proxyAgent;
    }

    await loadCoinPrice();
}

async function loadCoinPrice() {
    try {
        const influxDbClient = createInfluxDbClient();

        const symbols = coinPriceSymbols
            .split(',')
            .map(str => str.trim())
            .filter(str => str !== '');

        if (symbols.length === 0 || symbols.length > 1) {
            console.log(`Loading coin prices for ${coinPriceSymbols}`);
            let url = `${coinPriceApi}`;

            if (symbols.length > 1) {
                const symbolsParamValue = symbols.map(str => `"${str}"`).join(',');
                url += `?symbols=[${symbolsParamValue}]`;
            }

            const data = await doGet(url);

            console.log('Writing to InfluxDB');
            for (const priceSymbol of data) {
                const point = Point
                    .measurement('coinPrice')
                    .setTag('symbol', priceSymbol['symbol'])
                    .setTimestamp(new Date())
                    .setFloatField('price', priceSymbol['price']);
                await influxDbClient.write(point);
            }
        } else {
            console.log(`Loading coin prices for ${coinPriceSymbols}`);
            const url = `${coinPriceApi}?symbol=${symbols[0]}`
            const data = await doGet(url);

            console.log('Writing to InfluxDB');
            const point = Point
                .measurement('coinPrice')
                .setTag('symbol', data['symbol'])
                .setTimestamp(new Date())
                .setFloatField('price', data['price']);
            await influxDbClient.write(point);
        }
    } catch (error) {
        console.error(error)
    }
}

function createInfluxDbClient() {
    return new InfluxDBClient({
        host: 'https://us-east-1-1.aws.cloud2.influxdata.com',
        token: influxDbToken,
        database: influxDbBucket
    });
}

async function doGet(url) {
    const response = await fetch(url, nodeFetchOptions);
    return await response.json();
}

main().then(() => console.log('Finished'));
