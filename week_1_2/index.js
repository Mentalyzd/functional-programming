const express = require('express')
const request = require('request');
const { createLogger, transports, format} = require('winston')

let dataset = "https://raw.githubusercontent.com/Mentalyzd/functional-programming/main/week1/dataset2.json"

const app = express()
const port = 3001;

app.set('view engine','ejs')

app.get('/', async (req, res) => {
    return new Promise((resolve, reject) => {
        request( dataset, {json: true}, async (error, result, response) => {
            if (!error && result.statusCode == 200) resolve(response)
            else reject(new Error("Er is iets misgegaan"))
        })
    })
    .then((resp) => {
        //Pak alle unieke vragen
        let uniqQuest = getQuestions(resp)
        return [resp, uniqQuest]
    })
    .then((array) => {
        //Sorteer alle vragen op antwoord
        let sortedAnswers = sortOnQuestion(array[0], array[1])
        return [array[1], sortedAnswers]
    })
    .then((array) => {
        let countedAnswers = countAnswers(array[0], array[1])
        return [array[0], array[1], countedAnswers]
    })
    .then((array) => {
        res.render('index.ejs', {uniqQuest: array[0], sortedAnswers: array[1], countedAnswers: array[2]})
    })
})

const getQuestions = (resp) => {
    let uniqQuest = []
    for (var i=0; i < resp.length; i++) uniqQuest = uniqQuest.concat(Object.keys(resp[i]))
    uniqQuest = [...new Set(uniqQuest)]
    return uniqQuest
}

const sortOnQuestion = (object, questObj) => {
    let sortedAnswers = {}
    for(var j=0; j<questObj.length; j++) {
        sortedAnswers[questObj[j]] = []
        for (var i=0; i < object.length; i++) sortedAnswers[questObj[j]].push(toStringAndLowerCase(object[i][questObj[j]]))
    }
    return sortedAnswers
}

const toStringAndLowerCase = (string) => {
    if (typeof string === 'string' || string instanceof String) return string.toLowerCase()
    else return string.toString()
}

const countAnswers = (questObj, sortedAnswers) => {
    let countedAnswers = {}
    for(var j=0; j<questObj.length; j++) {
        countedAnswers[questObj[j]] = {}
        //Maar array van unieke antwoorden
        let uniqArray = [...new Set(sortedAnswers[questObj[j]])]
        //link vraag aan uniek antwoord
        for (var i = 0; i < uniqArray.length; i++) countedAnswers[questObj[j]][uniqArray[i]] = getOccurrence(sortedAnswers[questObj[j]], uniqArray[i])

    }
    return countedAnswers
}

const getOccurrence = (array, value) => {
    var count = 0
    array.forEach((v) => (v === value && count++))
    return count.toString()
}

const logger = createLogger({
    format: format.printf((info) => {return `[${info.level.toUpperCase()}] - ${info.message}`}),
    level: 'debug',
    transports:[new transports.Console()]
})

app.listen(port, () => {
    logger.info('Server running on port ' + port)
})