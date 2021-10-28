const express = require('express')
const request = require('request');

let url = "https://raw.githubusercontent.com/Mentalyzd/functional-programming/main/week1/dataset2.json"

const app = express()
const port = 2999;

//gebruik ejs
app.set('view engine','ejs')

app.get('/', function (req, res) {

    request(url, {json: true}, (error, result, body) => {
        if (error) {
            return  console.log(error)
        };
    
        if (!error && result.statusCode == 200) {
            console.log(body)
            //res.send(body)
            res.render('index.ejs', {object: body})
        };
    });
})
   
app.listen(port)