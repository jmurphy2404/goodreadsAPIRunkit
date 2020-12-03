const express = require('express');
const request = require('request');
const Promise = require('bluebird');
const xml2js  = require('xml2js');

const app          = express();
const parseString  = Promise.promisify(xml2js.parseString);
const requestAsync = Promise.promisify(request);

const DEFAULT_PAGE = 1;

function mapBook(bookData) {
    const data       = bookData.best_book.shift();
    const authorName = data.author.pop().name.shift();
    const imageUrl   = data.image_url.shift();
    const title      = data.title.shift();
    const year       = bookData.original_publication_year.shift(); 
    
    return {
        authorName,
        imageUrl,
        title,
        year
    };
}

function transformResponse(response) {
    const data  = response.GoodreadsResponse.search.shift();
    const items = data.results.shift().work;
    const list  = items.map(mapBook);
    const total = parseInt(data['total-results'].shift(), 10);

    return {
        list,
        total
    };
}

app.all('*', (req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Credentials', true);
    res.header('Access-Control-Allow-Headers', 'origin, x-requested-with, content-type, credentials, accept, Access-Control-Allow-Origin');
    res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
    next();
});

app.get('/search/:term', async function(req, res) {
    const page           = req.query.page || DEFAULT_PAGE;
    const requestOptions = {
        baseUrl : 'https://www.goodreads.com/',
        qs      : {
            key  : 'fylVXMzp2hU0m4YFUMSAUg',
            page,
            q    : req.params.term
        },
        uri     : '/search/index.xml'
    };
    
    try {
        const searchResponse = await requestAsync(requestOptions);
        const results        = await parseString(searchResponse.body);
        
        res.send(transformResponse(results));
    } catch(e) {
        res
            .status(500)
            .send(e);
    }
});

app.listen(3000, () => console.log('server started'));