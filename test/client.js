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
            const repos = Object.keys(trends);
            neq(repos.length, 0);
            for (const repo of repos) {
                const msg = JSON.stringify(repo, null, 2);
                assert(repo.id > 0, String(repo.id) + msg);
                assert(!repo.private, msg);
                assert(repo.html_url.startsWith('https://github.com/'), String(repo.html_url));
                assert(repo.owner, String(repo.owner));
                assert(repo.owner.html_url.startsWith('https://github.com/'), String(repo.owner.html_url));
            }
        });
    });

    it('fetch repositories data from another source', function() {
        const client = new Client({ useCodeHubInternalAPI: true });
        return client.fetchTrending('rust').then(repos => {
            neq(repos.length, 0);
            for (const repo of repos) {
                const msg = JSON.stringify(repo, null, 2);
                assert(repo.id > 0, String(repo.id) + msg);
                assert(!repo.private, msg);
                assert(repo.html_url.startsWith('https://github.com/'), String(repo.html_url));
                assert(repo.owner, String(repo.owner));
                assert(repo.owner.html_url.startsWith('https://github.com/'), String(repo.owner.html_url));
                if (repo.language) {
                    assert(repo.language, String(repo.language));
                } else {
                    eq(repo.language, null);
                }
            }
        });
    });
});
