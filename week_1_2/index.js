const express = require('express')
const request = require('request');

let dataset = "https://raw.githubusercontent.com/Mentalyzd/functional-programming/main/week_1_2/dataset.json"

const app = express()
const port = 2999;

app.use(express.static('public', {}))

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
        //Tel antwoorden die hetzelfde zijn
        let countedAnswers = countAnswers(array[0], array[1])
        return [array[0], array[1], countedAnswers]
    })
    .then((array) => {
        res.render('index.ejs', {uniqQuest: array[0], sortedAnswers: array[1], countedAnswers: array[2]})
    })
})

const getQuestions = (resp) => {
    let uniqQuest = []
    //Voeg alle antwoorden in een object
    for (let i=0; i < resp.length; i++) uniqQuest = uniqQuest.concat(Object.keys(resp[i]))
    //Voeg alle duplicates samen
    uniqQuest = [...new Set(uniqQuest)]
    return uniqQuest
}

const sortOnQuestion = (object, questObj) => {
    let sortedAnswers = {}
    for(let j=0; j<questObj.length; j++) {
        //Maak van elke vraag een categorie
        sortedAnswers[questObj[j]] = []
        //Ga alle antwoorden langs en link aan categorie
        for (let i=0; i < object.length; i++) sortedAnswers[questObj[j]].push(toStringAndLowerCase(object[i][questObj[j]]))
    }
    return sortedAnswers
}

const toStringAndLowerCase = (string) => {
    //Maak string lowercase of wanneer het geen string is, string maken
    if (typeof string === 'string' || string instanceof String) return string.toLowerCase().replace(',', '-').replace(', ', '-').replace('- ', '-')
    else return string.toString()
}

const countAnswers = (questObj, sortedAnswers) => {
    let countedAnswers = {}
    for(let j=0; j<questObj.length; j++) {
        countedAnswers[questObj[j]] = {}
        //Maar array van unieke antwoorden
        let uniqArray = [...new Set(sortedAnswers[questObj[j]])]
        //link vraag aan uniek antwoord
        for (let i = 0; i < uniqArray.length; i++) countedAnswers[questObj[j]][uniqArray[i]] = getOccurrence(sortedAnswers[questObj[j]], uniqArray[i])
    }
    return countedAnswers
}

const getOccurrence = (array, value) => {
    let count = 0
    //Ga array langs en check of values gelijk zijn
    array.forEach((v) => (v === value && count++))
    return count.toString()
}

app.listen(port, () => {
    console.log('Server running on port ' + port)
})