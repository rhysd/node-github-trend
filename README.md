Scraping GitHub Trending Repositories
=====================================
[![npm version](https://badge.fury.io/js/github-trend.svg)](http://badge.fury.io/js/github-trend)
[![Build Status](https://travis-ci.org/rhysd/node-github-trend.svg?branch=travis)](https://travis-ci.org/rhysd/node-github-trend)

[github-trend](https://www.npmjs.com/package/github-trend) is a library for scraping GitHub trending repositories.

## Only scraping

```javascript
const Trending = require("github-trend");
const scraper = new Trending.Scraper();

// Empty string means 'all languages'
scraper.scrapeTrendingRepos("").then(repos => {
    repos.forEach(function(repo){
        console.log(repo.owner);
        console.log(repo.name);
    });
}).catch(err => {
    console.error(err.message);
});

// For other languages
scrapeTrendingRepos("rust");
scrapeTrendingRepos("vim");
scrapeTrendingRepos("go");
```

`Scraper` only scrapes GitHub trending page. This returns an array of repository information.
This method is relatively faster because of sending request only once per language.

## Scrape and get more info (in one request,without api calls)
```javascript
const Trending = require("github-trend");
const scraper = new Trending.Scraper();

// Empty string means 'all languages'
scraper.scrapeTrendingReposFullInfo("").then(repos => {
    for (const repo of repos) {
        console.log(repo.owner);
        console.log(repo.name);
        console.log(repo.description);
        console.log(repo.language);
        console.log(repo.allStars);
        console.log(repo.todaysStars);
        console.log(repo.forks);
    }
}).catch(err => {
    console.error(err.message);
});

// For other languages
scraper.scrapeTrendingReposFullInfo("rust");
scraper.scrapeTrendingReposFullInfo("vim");
scraper.scrapeTrendingReposFullInfo("go");
```


## Scraping and getting full repository information

```javascript
const Trending = require("github-trend");
const client = new Trending.Client();

client.fetchTrending("").then(repos => {
    for (const repo of repos) {
        // Result of https://api.github.com/repos/:user/:name
        console.log(repo);
    }
}).catch(err => {
    console.error(err.message);
});

// Fetch all API call asynchronously
client.fetchTrendings(["", "vim", "go"]).then(repos => {
    for (const lang in repos) {
        for (const repo of repos[lang]) {
            // Result of https://api.github.com/repos/:user/:name
            console.log(repo);
        }
    }
}).catch(err => {
    console.error(err.message);
});
```

`Client` contains scraper and scrapes GitHub trending page, then gets all repositories' full information using GitHub `/repos/:user/:name` API.
This takes more time than only scraping, but all requests are sent asynchronously and in parallel.

## Scraping language information

```javascript
const Trending = require("github-trend");
const scraper = new Trending.Scraper();

scraper.scrapeLanguageYAML().then(langs => {
    for (const name in langs) {
        console.log(name);
        console.log(langs[name]);
    }
}).catch(err => {
    console.error(err.message);
});
```

This returns all languages information detected in GitHub by scraping [here](https://raw.githubusercontent.com/github/linguist/master/lib/linguist/languages.yml).
The result is cached and reused.

## Scraping language color

```javascript
const Trending = require("github-trend");
const scraper = new Trending.Scraper();

scraper.scrapeLanguageColors().then(colors => {
    for (const name in colors) {
        console.log("name: " + name);
        console.log("color: " + colors[name]);
    }
}).catch(err => {
    console.error(err.message);
});

// If you want only language names:
scraper.scrapeLanguageNames().then(names => {
    for (const name of names) {
        console.log(name);
    }
}).catch(err => {
    console.error(err.message);
});
```

## License

Distributed under [the MIT license](LICENSE.txt).

