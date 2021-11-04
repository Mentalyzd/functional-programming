const express = require('express');
const request = require('request');

let datasetWazirx = "https://api.wazirx.com/api/v2/trades?market="
let datasetKucoin = "https://api.kucoin.com/api/v1/market/stats?symbol="

const app = express()
const port = 80;

app.use(express.static('public', {}))

app.set('view engine','ejs')

app.get('/', async (req, res) => {
    if (req.query.symbol == null && req.query.pair == null) {
        res.render('index.ejs')
    } else {
        let market = processSymbols(req.query.symbol, req.query.pair)
        let wazirxRes = await fetchApiDataset(datasetWazirx, marketUndash(market))
        .then((obj) => {
            let prices = getMaxMinValues(obj, 'price')
            obj = cleanWazirxObj (obj, prices)
            return [prices, obj]
        })

        let kucoinRes = await fetchApiDataset(datasetKucoin, marketCaps(market))
        .then((obj) => {return cleanKucoinObj(obj['data'])})
        .then((obj) => {return cleanKucoinValues(obj)})

        res.render('index.ejs', { dataset1: wazirxRes, dataset2: kucoinRes, symbol: req.query.symbol, pair: req.query.pair })
    }
})

const cleanWazirxObj = (arr, prices) => {
    let order = ['price', 'volume', 'created_at']
    let ar = []
    for (let i=0; i < arr.length; i++) {
        let o = {}
        for (let j=0; j < order.length; j++) {
            if(order[j] == 'created_at') {
                o[order[j]] = cleanUpTimeData(arr[i][order[j]])
            } else if(order[j] == 'price') {
                o['pricePerc'] = calcPercentage(prices.maxprice, prices.minprice, arr[i][order[j]], 1.5, 0.99, 10)
                o[order[j]] = arr[i][order[j]]
            } else {
                o[order[j]] = arr[i][order[j]]
            }
        }
        ar.push(o)
    }
    return ar.reverse()
}

const calcPercentage = (maxPrice, minPrice, currentPrice ,roof, cutOff, multi) => {
    let priceCutOff = currentPrice - (minPrice * cutOff)
    let pricePerc = priceCutOff / (maxPrice * roof) * 100
    return pricePerc * multi
  }

const getMaxMinValues = (obj, key) => {
    let array = []
    let o = {}
    for(var i=obj.length-1; i>=0; i--) array.push(obj[i][key])
    o['min' + key] = Math.min(...array)
    o['max' + key] = Math.max(...array)
    return o
  }

const cleanUpTimeData = (t) => {
    return t.slice(11, -1)
}


const cleanKucoinObj = (obj) => {
    let o = {}
    let order = ['last', 'changePrice', 'changeRate', 'buy', 'sell', 'low', 'high', 'vol', 'volValue' , 'averagePrice']
    for (let i=0; i < order.length; i++) o[order[i]] = obj[order[i]]
    return o
}

const cleanKucoinValues = (obj) => {
    obj.last = setDollar(obj.last)
    obj.changePrice = priceChange(obj.changePrice)
    obj.changeRate = changeRate(obj.changeRate)
    obj.buy = setDollar(obj.buy)
    obj.sell = setDollar(obj.sell)
    obj.low = setDollar(obj.low)
    obj.high = setDollar(obj.high)
    obj.vol = toThousand(obj.vol)
    obj.volValue = setDollar(setCommas(obj.volValue))
    obj.averagePrice = setDollar(obj.averagePrice)
    obj.color = getColor(obj.changeRate)
    return obj
}

const getColor = (n) => {
    return n.includes('+') == true ? '#00F346' : '#FF4242'
}

const setDollar = (n) => {
    return '$' + n.toString()
}

const priceChange = (n) => {
    return n.includes('-') == true ? '- ' + setDollar(n.replace('-', '')) : '+ ' + setDollar(n)
}

const changeRate = (n) => {
    return n.includes('-') == true ? (n * 100).toString().slice(0, 5) + '%' : '+' + (n * 100).toString().slice(0, 5)  + '%'
}

const toThousand = (n) => {
    return Math.abs(n) > 999 ? Math.sign(n)*((Math.abs(n)/1000).toFixed(1)) + 'k' : Math.sign(n)*Math.abs(n)
}

const setCommas = (n) => {
    return Number(n).toLocaleString().split('.')[0]
}

const processSymbols = (symbol, pair) => {return symbol + '-' + pair}
const marketUndash = (market) => {return market.toLowerCase().replace("-", "")}
const marketCaps = (market) => {return market.toUpperCase()}

const fetchApiDataset = async (dataset, market) => {
    return new Promise((resolve, reject) => {
        request( dataset + market, {json: true}, (error, result, response) => {
            !error && result.statusCode == 200 ? resolve(response) : reject(error)
        })
    }).catch(error => error)
}

app.listen(port, () => {console.log('Server running on port ' + port)})