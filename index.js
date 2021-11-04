const express = require('express');
const request = require('request');

//zet endpoints
let wazirxEndpoint = "https://api.wazirx.com/api/v2/trades?market="
let kucoinEndpoint = "https://api.kucoin.com/api/v1/market/stats?symbol="

const app = express()
const port = 80;

//make 'public' folder plublic
app.use(express.static('public', {}))

//use EJS render engine
app.set('view engine','ejs')

app.get('/', async (req, res) => {

    //kijk of de gebruiker al een request heeft gemaakt
    if (req.query.symbol == null && req.query.pair == null) {
        res.render('index.ejs')
    } else {

        //set market uit de get
        let market = processSymbols(req.query.symbol, req.query.pair)

        //fetch de wazirx api
        let wazirxRes = await fetchApiDataset(wazirxEndpoint, marketUndash(market))
        .then((obj) => {
            let prices = getMaxMinValues(obj, 'price')
            obj = cleanWazirxObj (obj, prices)
            return [prices, obj]
        })

        //fetch de kucoin api
        let kucoinRes = await fetchApiDataset(kucoinEndpoint, marketCaps(market))
        .then((obj) => {return cleanKucoinObj(obj['data'])})
        .then((obj) => {return cleanKucoinValues(obj)})

        //render de pagina met alle schone data
        res.render('index.ejs', { dataset1: wazirxRes, dataset2: kucoinRes, symbol: req.query.symbol, pair: req.query.pair })
    }
})

//Wazirx data transforming

//schoon Wazirx data op
const cleanWazirxObj = (arr, prices) => {

    //set welke data ik terug wil krijgen
    let order = ['price', 'volume', 'created_at']
    let ar = []

    //ga values in objecten in de array langs en geef alleen de data terug uit 'order'
    for (let i=0; i < arr.length; i++) {
        let o = {}
        for (let j=0; j < order.length; j++) {

            //schoon de datum/tijd data op
            if(order[j] == 'created_at') {
                o[order[j]] = cleanUpTimeData(arr[i][order[j]])

            //als order bij 'price' is bereken dan een nieuwe value aan de hand van functie
            } else if(order[j] == 'price') {
                o['pricePerc'] = calcPercentage(prices.maxprice, prices.minprice, arr[i][order[j]], 1.5, 0.99, 10)
                o[order[j]] = arr[i][order[j]]
            } else {
                o[order[j]] = arr[i][order[j]]
            }
        }

        //construeer de array opnieuw met de nieuwe objecten
        ar.push(o)
    }
    return ar.reverse()
}

//berekent hoelang de staven in de staaf grafiek moeten zijn
const calcPercentage = (maxPrice, minPrice, currentPrice ,roof, cutOff, multi) => {

    //complexe wiskundige berekeningen :p
    let priceCutOff = currentPrice - (minPrice * cutOff)
    let pricePerc = priceCutOff / (maxPrice * roof) * 100
    return pricePerc * multi
  }

//berekent max en min values uit een object
const getMaxMinValues = (obj, key) => {
    let array = []
    let o = {}
    
    //zet values om in een array
    for(var i=obj.length-1; i>=0; i--) array.push(obj[i][key])

    //maak weer object
    o['min' + key] = Math.min(...array)
    o['max' + key] = Math.max(...array)
    return o
  }

//haalt stuk weg uit string die niet nodig is
//bijv. zet: '2021-11-04T14:41:15Z'
//om naar: '14:41:15'
const cleanUpTimeData = (t) => {
    return t.slice(11, -1)
}


//Kucoin data transforming

//Haal alleen values op die ik ga gebruiken
const cleanKucoinObj = (obj) => {
    let o = {}
    let order = ['last', 'changePrice', 'changeRate', 'buy', 'sell', 'low', 'high', 'vol', 'volValue' , 'averagePrice']
    for (let i=0; i < order.length; i++) o[order[i]] = obj[order[i]]
    return o
}

//Zet alle data om in specifieke strings
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

//Calculeer kleur op basis van string
const getColor = (n) => {
    return n.includes('+') == true ? '#00F346' : '#FF4242'
}

//Zet dollar voor value
const setDollar = (n) => {
    return '$' + n.toString()
}

// Bekijkt of de value een '-' bevat zo niet voeg '+'  en zet characters op goede plek
const priceChange = (n) => {
    return n.includes('-') == true ? '- ' + setDollar(n.replace('-', '')) : '+ ' + setDollar(n)
}

// Bekijkt of de value een '-' bevat zo niet voeg '+'  en verander value naar percentage
const changeRate = (n) => {
    return n.includes('-') == true ? (n * 100).toString().slice(0, 5) + '%' : '+' + (n * 100).toString().slice(0, 5)  + '%'
}

//Bekijk of value duizendste bevat zet format om naar 'k' notering
const toThousand = (n) => {
    return Math.abs(n) > 999 ? Math.sign(n)*((Math.abs(n)/1000).toFixed(1)) + 'k' : Math.sign(n)*Math.abs(n)
}

//Zet kommas neer voor beter leesbaarheid grote getallen
const setCommas = (n) => {
    return Number(n).toLocaleString().split('.')[0]
}

//Zet markets om voor juiste api
const processSymbols = (symbol, pair) => {return symbol + '-' + pair}
const marketUndash = (market) => {return market.toLowerCase().replace("-", "")}
const marketCaps = (market) => {return market.toUpperCase()}

//Fetch functie voor ophalen van data, gebruik daarvoor doorgegeven endpoint en market
const fetchApiDataset = async (endpoint, market) => {
    return new Promise((resolve, reject) => {
        request( endpoint + market, {json: true}, (error, result, response) => {
            !error && result.statusCode == 200 ? resolve(response) : reject(error)
        })
    }).catch(error => error)
}

//Run server
app.listen(port, () => {console.log('Server running on port ' + port)})