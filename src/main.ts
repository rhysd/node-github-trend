import * as request from 'request';
import * as cheerio from 'cheerio';
import * as yaml from 'js-yaml';

export interface RepositoryEntry {
    owner: string;
    name: string;
}

export interface Repository {
    [param: string]: any;
}

export interface Repositories {
    [lang: string]: Repository[];
}

export interface ScraperConfig {
    proxy?: string;
}

export interface Language {
    color: string;
    aliases?: string[];
}

export interface Languages {
    [lang: string]: Language;
}

export interface FullRepository {
    index: number;
    name: string;
    owner: string;
    description: string | null; // When no description is set, this field will be null.
    language: string | null;
    allStars: number;
    todaysStars: number;
    forks: number;
    [k: string]: string | number;
}

const RE_HREF_SCRAPE = /^\/([^\/]+)\/([^\/]+)$/;
const RE_DIGITS = /\d+/;
const RE_COMMA = /,/g;

export class Scraper {
    config: ScraperConfig;
    private cache: object;

    constructor(config?: ScraperConfig) {
        this.config = config || {};
        this.cache = null;
    }

    fetchTrendPage(lang_name: string) {
        const opts: request.Options = {
            url: 'https://github.com/trending',
        };

        if (lang_name) {
            opts.url += '?l=' + lang_name;
        }

        if (this.config.proxy) {
            opts.proxy = this.config.proxy;
        }

        return new Promise<string>((resolve, reject) => {
            request(opts, (err, res, body) => {
                if (err) {
                    reject(err);
                    return;
                }

                if (res.statusCode !== 200) {
                    reject(new Error('Invalid status: ' + res.statusCode));
                    return;
                }

                resolve(body);
            });
        });
    }

    scrapeTrendingReposFullInfo(lang_name: string) {
        return this.fetchTrendPage(lang_name).then((html: string) => {
            const results = [];
            const dom = cheerio.load(html);
            const items = dom('.repo-list li');
            for (let i = 0; i < items.length; i++) {
                const li = items[i];
                const result = {
                    index: i,
                    name: null,
                    owner: null,
                    description: null,
                    language: null,
                    langColor: null,
                    allStars: null,
                    todaysStars: null,
                    forks: null,
                } as FullRepository;

                const domElem = dom(li);
                const a = domElem.find('h3 a')[0];

                const href: string = a.attribs.href;
                const match = href.match(RE_HREF_SCRAPE);

                if (match) {
                    result.owner = match[1];
                    result.name = match[2];
                }

                // extract description
                const p = domElem.find('p')[0];
                if (p) {
                    result.description = p.children[0].data;
                }

                // extract programming language
                const lang = domElem.find('[itemprop="programmingLanguage"]')[0];
                if (lang) {
                    result.language = lang.children[0].data;
                }

                const langColor = domElem.find('.repo-language-color')[0];
                if (langColor) {
                    const style = langColor.attribs.style;
                    if (style.indexOf('background-color:#') === 0) {
                        // -1 means stripping the last ';'
                        result.langColor = style.slice('background-color:'.length, -1);
                    }
                }

                const counts = domElem.find('.muted-link.d-inline-block.mr-3');

                // extract all stars
                const allStars = counts[0];
                if (allStars) {
                    result.allStars = parseInt(allStars.children[2].data.replace(RE_COMMA, ''), 10);
                }

                // extract number of forks
                const forks = counts[1];
                if (forks) {
                    result.forks = parseInt(allStars.children[2].data.replace(RE_COMMA, ''), 10);
                }

                // extract todays stars
                const todaysStars = domElem.find('.f6.text-gray.mt-2 > span:last-child')[0];
                if (todaysStars) {
                    const numStars = todaysStars.children[2].data.replace(RE_COMMA, '').match(RE_DIGITS);
                    if (numStars !== null) {
                        result.todaysStars = parseInt(numStars[0], 10);
                    }
                }

                // Cleanup result
                const keys = Object.keys(result);
                keys.forEach(k => {
                    const v = result[k];
                    if (typeof v === 'string') {
                        result[k] = v.trim();
                    }
                });

                results.push(result);
            }
            return results;
        });
    }

    scrapeTrendingRepos(lang_name: string) {
        return this.fetchTrendPage(lang_name).then((html: string) => {
            const dom = cheerio.load(html);
            const links = dom('.repo-list h3 a');
            const repos = [];
            /* tslint:disable:prefer-for-of */
            for (let i = 0; i < links.length; i++) {
                /* tslint:enable:prefer-for-of */
                const a = links[i];
                const href: string = a.attribs.href;
                const match = href.match(RE_HREF_SCRAPE);
                if (!match) {
                    // Ignore parse failures
                    continue;
                }
                repos.push({
                    owner: match[1],
                    name: match[2],
                });
            }
            return repos;
        });
    }

    fetchLanguageYAML() {
        if (this.cache !== null) {
            return Promise.resolve(this.cache);
        }

        return new Promise((resolve, reject) => {
            const opts: request.Options = {
                url: 'https://raw.githubusercontent.com/github/linguist/master/lib/linguist/languages.yml',
            };

            if (this.config.proxy) {
                opts.proxy = this.config.proxy;
            }

            request(opts, (err, res, body) => {
                if (err) {
                    reject(err);
                    return;
                }

                if (res.statusCode !== 200) {
                    reject(new Error('Invalid status: ' + res.statusCode));
                    return;
                }

                const langs: Languages = yaml.safeLoad(body);
                this.cache = langs;
                resolve(langs);
            });
        });
    }

    scrapeLanguageColors() {
        return this.fetchLanguageYAML().then((langs: Languages) => {
            const result: { [key: string]: string } = {};
            for (const name in langs) {
                const lang: Language = langs[name];
                if (!lang.color) {
                    continue;
                }

                result[name.toLowerCase()] = lang.color;
                if (lang.aliases !== undefined) {
                    for (const alias of lang.aliases) {
                        result[alias.toLowerCase()] = lang.color;
                    }
                }
            }
            return result;
        });
    }

    scrapeLanguageNames() {
        return this.fetchLanguageYAML().then((langs: Languages) => {
            const result: string[] = [];
            for (const name of Object.keys(langs)) {
                result.push(name);
                const lang: Language = langs[name];
                if (!lang.color) {
                    continue;
                }

                if (lang.aliases !== undefined) {
                    Array.prototype.push.apply(result, lang.aliases);
                }
            }
            return result;
        });
    }
}

export class Client {
    scraper: Scraper;
    token: string;

    constructor(config?: ScraperConfig, token?: string) {
        this.scraper = new Scraper(config);
        this.token = token || null;
    }

    fetchGetRepoAPI(repo: RepositoryEntry) {
        return new Promise((resolve, reject) => {
            const headers: { [h: string]: string } = {
                'User-Agent': 'request',
                Accept: 'application/vnd.github.v3+json',
            };

            if (this.token) {
                headers.Authorization = 'token ' + this.token;
            }

            const opts: request.Options = {
                url: `https://api.github.com/repos/${repo.owner}/${repo.name}`,
                headers,
            };

            if (this.scraper.config.proxy) {
                opts.proxy = this.scraper.config.proxy;
            }

            request(opts, (err, res, body) => {
                if (err) {
                    reject(err);
                    return;
                }

                if (res.statusCode !== 200) {
                    reject(new Error('Invalid status: ' + res.statusCode));
                    return;
                }

                // Note:
                // Sometimes response json may be broken and crashed parser
                try {
                    resolve(JSON.parse(body));
                } catch (e) {
                    reject(e);
                }
            });
        });
    }

    fetchTrending(lang: string) {
        return this.scraper.scrapeTrendingRepos(lang).then((repos: RepositoryEntry[]) => {
            return Promise.all(repos.map(r => this.fetchGetRepoAPI(r)));
        });
    }

    fetchAppendingReadme(repo: { [key: string]: any }) {
        return new Promise(resolve => {
            const readme_url = repo.html_url + '/blob/' + repo.default_branch + '/README.md';
            const opts: request.Options = {
                url: readme_url,
                method: 'HEAD',
            };

            if (this.scraper.config.proxy) {
                opts.proxy = this.scraper.config.proxy;
            }

            request(opts, (err, res, _) => {
                if (err) {
                    resolve(repo);
                    return;
                }

                if (res.statusCode !== 200) {
                    resolve(repo);
                    return;
                }

                repo.readme_url = readme_url;
                resolve(repo);
            });
        });
    }

    fetchTrendingWithReadme(lang: string) {
        return this.fetchTrending(lang).then((repos: Repository[]) => {
            return Promise.all(repos.map(r => this.fetchAppendingReadme(r)));
        });
    }

    fetchTrendingsWithReadme(langs: string[]) {
        return Promise.all(langs.map(l => this.fetchTrendingWithReadme(l))).then((trendings: Repository[][]) => {
            const result: Repositories = {};
            langs.forEach((lang, idx) => {
                result[lang] = trendings[idx];
            });
            return result;
        });
    }

    fetchTrendings(langs: string[]) {
        return Promise.all(langs.map(l => this.fetchTrending(l))).then((trendings: Repository[][]) => {
            const result: Repositories = {};
            langs.forEach((lang, idx) => {
                result[lang] = trendings[idx];
            });
            return result;
        });
    }
}
