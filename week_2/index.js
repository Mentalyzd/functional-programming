const express = require('express');
const request = require('request');

let datasetWazir = "https://api.wazirx.com/api/v2/trades?market="
let datasetKucoin = "https://api.kucoin.com/api/v1/market/stats?symbol="

const app = express()
const port = 4000;

app.use(express.static('public', {}))

app.set('view engine','ejs')

app.get('/', async (req, res) => {
    if (req.query.symbol == null && req.query.pair == null) {
        res.render('index.ejs')
    } else {
        let market = processSymbols(req.query.symbol, req.query.pair)
        let wazirRes = await fetchApiDataset(datasetWazir, marketUndash(market))
        let kucoinRes = await fetchApiDataset(datasetKucoin, marketCaps(market))
        res.render('index.ejs', { dataset1: wazirRes, dataset2: kucoinRes, symbol: req.query.symbol, pair: req.query.pair })
    }
})

const processSymbols = (symbol, pair) => {return symbol + '-' + pair}

const marketUndash = (market) => {return market.toLowerCase().replace("-", "")}

const marketCaps = (market) => {return market.toUpperCase()}

const fetchApiDataset = async (dataset, market) => {
    return new Promise((resolve, reject) => {
        request( dataset + market, {json: true}, (error, result, response) => {
            if (!error && result.statusCode == 200) resolve(response) 
            else reject(error)
        })
    }).catch(error => error)
}

app.listen(port, () => {console.log('Server running on port ' + port)})