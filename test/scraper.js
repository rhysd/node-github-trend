const assert = require('assert');
const neq = assert.notStrictEqual;
const Scraper = require('../build/main').Scraper;

describe('Scraper', function() {
    this.timeout(10000);

    it('scrapes trending repositories for all languages', function() {
        return new Scraper().scrapeTrendingReposFullInfo('all').then(repos => {
            assert(repos.length > 0);
            for (const repo of repos) {
                assert(repo.index >= 0);
                neq(repo.name, null);
                neq(repo.owner, null);
                neq(repo.description, null);
                neq(repo.language, undefined);
                neq(repo.allStars, null);
                neq(repo.todaysStars, null);
            }
        });
    });

    it('scrapes colors of languages', function() {
        return new Scraper().scrapeLanguageColors().then(langs => {
            assert(Object.keys(langs).length > 0);
            for (const name in langs) {
                assert(name);
                const color = langs[name];
                assert((/#[0-9a-f]{6}/i).test(color));
            }
        });
    });
});
