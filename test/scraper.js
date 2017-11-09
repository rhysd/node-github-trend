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
                const msg = JSON.stringify(repo)
                neq(repo.name, null, msg);
                neq(repo.owner, null, msg);
                neq(repo.language, undefined, msg);
                neq(repo.allStars, null, msg);
                assert(repo.allStars >= 0, msg);
                neq(repo.todaysStars, null, msg);
                assert(repo.todaysStars >= 0, msg);
                neq(repo.forks, null, msg);
                assert(repo.forks >= 0, msg);
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

    it('scrapes names of languages', function() {
        return new Scraper().scrapeLanguageNames().then(names => {
            assert(names.length > 0);
            for (const name of names) {
                assert(name);
            }
        });
    });
});
