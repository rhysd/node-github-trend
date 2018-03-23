const assert = require('assert');
const Scraper = require('../build/main').Scraper;

const neq = assert.notStrictEqual;
const eq = assert.strictEqual;
const RE_COLOR = /^#(:?[0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})$/i;

describe('Scraper', function() {
    this.timeout(10000);

    it('scrapes trending repositories for all languages', function() {
        return new Scraper().scrapeTrendingReposFullInfo('all').then(repos => {
            assert(repos.length > 0);
            for (const repo of repos) {
                assert(repo.index >= 0);
                const msg = JSON.stringify(repo);
                neq(repo.name, null, msg);
                neq(repo.owner, null, msg);
                neq(repo.language, undefined, msg);
                neq(repo.allStars, null, msg);
                assert(repo.allStars >= 0, msg);
                neq(repo.todaysStars, null, msg);
                assert(repo.todaysStars >= 0, msg);
                if (repo.forks) {
                    assert(repo.forks >= 0, msg);
                }
                if (repo.langColor) {
                    assert(RE_COLOR.test(repo.langColor), msg);
                } else {
                    assert(repo.langColor === null, msg);
                }
            }
        });
    });

    it('scrapes trending repositories for all languages without using gzip encoding', function() {
        return new Scraper({ useGzip: false }).scrapeTrendingReposFullInfo('all').then(repos => {
            assert(repos.length > 0);
            for (const repo of repos) {
                assert(repo.index >= 0);
                const msg = JSON.stringify(repo);
                neq(repo.name, null, msg);
                neq(repo.owner, null, msg);
                neq(repo.language, undefined, msg);
                neq(repo.allStars, null, msg);
                assert(repo.allStars >= 0, msg);
                neq(repo.todaysStars, null, msg);
                assert(repo.todaysStars >= 0, msg);
                if (repo.forks) {
                    assert(repo.forks >= 0, msg);
                }
                if (repo.langColor) {
                    assert(RE_COLOR.test(repo.langColor), msg);
                } else {
                    assert(repo.langColor === null, msg);
                }
            }
        });
    });

    it('scrapes simple trending repositories for all languages', function() {
        return new Scraper().scrapeTrendingRepos('all').then(repos => {
            assert(repos.length > 0);
            for (const repo of repos) {
                const msg = JSON.stringify(repo);
                neq(repo.name, null, msg);
                neq(repo.owner, null, msg);
                neq(repo.name, '', msg);
                neq(repo.owner, '', msg);
            }
        });
    });

    it('scrapes colors of languages', function() {
        return new Scraper().scrapeLanguageColors().then(langs => {
            const names = Object.keys(langs);
            assert(names.length > 0);
            for (const name of names) {
                assert(name);
                const color = langs[name];
                assert(RE_COLOR.test(color));
            }
        });
    });

    it('caches languages data', function() {
        let previous;
        const s = new Scraper();
        return s
            .fetchLanguageYAML()
            .then(data => {
                previous = data;
            })
            .then(() => s.fetchLanguageYAML())
            .then(data => {
                eq(previous, data);
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
