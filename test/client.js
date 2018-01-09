const assert = require('assert');
const Client = require('../build/main').Client;

const neq = assert.notStrictEqual;
const eq = assert.strictEqual;

describe('Client', function() {
    this.timeout(10000);

    it('scrapes and fetch repositories data from GitHub API', function() {
        const token = process.env.GITHUB_TOKEN;
        if (!token) {
            this.skip();
        }
        const client = new Client({ token });
        return client.fetchTrendings(['all']).then(langTrends => {
            assert(langTrends.all, String(langTrends.all));
            const trends = langTrends.all;
            const langs = Object.keys(trends);
            neq(langs.length, 0);
            for (const lang of langs) {
                const trend = trends[lang];
                const msg = JSON.stringify(trend, null, 2);
                assert(trend.id > 0, String(trend.id) + msg);
                assert(!trend.private, msg);
                assert(trend.html_url.startsWith('https://github.com/'), String(trend.html_url));
                assert(trend.owner, String(trend.owner));
                assert(trend.owner.html_url.startsWith('https://github.com/'), String(trend.owner.html_url));
            }
        });
    });
});
