// [task_local]
// 定时同步加密货币APR到InfluxDB
// 0 * * * * crypto-coin-apr.js, tag=定时同步加密货币APR到InfluxDB, enabled=true

const fetch = require('node-fetch');
const {HttpsProxyAgent} = require('https-proxy-agent');
const {InfluxDBClient, Point} = require('@influxdata/influxdb3-client');

const binanceSimpleEarnProductApi = 'https://www.binance.com/bapi/earn/v1/friendly/finance-earn/simple/product/simpleEarnProducts';
const okxSimpleEarnProductsApi = 'https://www.okx.com/priapi/v1/earn/simple-earn/all-products?type=all';

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

    await loadBinanceSimpleEarnProducts();
    await loadOkxSimpleEarnProducts();
}

async function loadBinanceSimpleEarnProducts() {
    try {
        const influxDbClient = createInfluxDbClient();

        console.log('Loading Binance Simple Earn products');
        const data = await doGet(binanceSimpleEarnProductApi);
        const productList = data['data']['list'];

        console.log('Writing to InfluxDB');
        for (const product of productList) {
            const asset = product['asset'];
            let apr = product['productDetailList'][0]['marketApr'];
            if (apr) {
                apr = parseFloat(apr) * 100
            } else {
                apr = 0;
            }

            const point = Point
                .measurement('binanceSimpleEarn')
                .setTag('asset', asset)
                .setTimestamp(new Date())
                .setFloatField('apr', apr);
            await influxDbClient.write(point);
        }
    } catch (error) {
        console.error(error);
    }
}

async function loadOkxSimpleEarnProducts() {
    try {
        const influxDbClient = createInfluxDbClient();

        console.log('Loading OKX Simple Earn products');
        const data = await doGet(okxSimpleEarnProductsApi);
        const productList = data['data']['all'];

        if (productList.length === 0) {
            console.error('OKX Simple Earn product list returned empty');
            return;
        }

        console.log('Writing to InfluxDB');
        for (const product of productList) {
            const asset = product['investCurrency']['currencyName'];
            let apr = product['rate']['rateNum']['value'][0];
            if (apr) {
                apr = parseFloat(apr)
            } else {
                apr = 0;
            }

            const point = Point
                .measurement('okxSimpleEarn')
                .setTag('asset', asset)
                .setTimestamp(new Date())
                .setFloatField('apr', apr);
            await influxDbClient.write(point);
        }
    } catch (error) {
        console.error(error)
    }
}

async function doGet(url) {
    const response = await fetch(url, nodeFetchOptions);
    return await response.json();
}

function createInfluxDbClient() {
    return new InfluxDBClient({
        host: 'https://us-east-1-1.aws.cloud2.influxdata.com',
        token: influxDbToken,
        database: influxDbBucket
    });
}

main().then(() => console.log('Finished'));
