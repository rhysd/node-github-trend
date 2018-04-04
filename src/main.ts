import * as request from 'request';
import * as cheerio from 'cheerio';
import * as yaml from 'js-yaml';

export interface RepositoryEntry {
    owner: string;
    name: string;
}

export interface APIOwnerOrOrg {
    login: string;
    id: number;
    avatar_url: string;
    gravatar_id: string;
    url: string;
    html_url: string;
    followers_url: string;
    following_url: string;
    gists_url: string;
    starred_url: string;
    subscriptions_url: string;
    organizations_url: string;
    repos_url: string;
    events_url: string;
    received_events_url: string;
    type: string;
    site_admin: boolean;
}

export interface APILicense {
    key: string;
    name: string;
    spdx_id: string | null;
    url: string | null;
}

export interface APIRepository {
    id: number;
    name: string;
    full_name: string;
    owner: APIOwnerOrOrg;
    private: boolean;
    html_url: string;
    description: string;
    fork: boolean;
    url: string;
    forks_url: string;
    keys_url: string;
    collaborators_url: string;
    teams_url: string;
    hooks_url: string;
    issue_events_url: string;
    events_url: string;
    assignees_url: string;
    branches_url: string;
    tags_url: string;
    blobs_url: string;
    git_tags_url: string;
    git_refs_url: string;
    trees_url: string;
    statuses_url: string;
    languages_url: string | null;
    stargazers_url: string;
    contributors_url: string;
    subscribers_url: string;
    subscription_url: string;
    commits_url: string;
    git_commits_url: string;
    comments_url: string;
    issue_comment_url: string;
    contents_url: string;
    compare_url: string;
    merges_url: string;
    archive_url: string;
    downloads_url: string;
    issues_url: string;
    pulls_url: string;
    milestones_url: string;
    notifications_url: string;
    labels_url: string;
    releases_url: string;
    deployments_url: string;
    created_at: string;
    updated_at: string;
    pushed_at: string;
    git_url: string;
    ssh_url: string;
    clone_url: string;
    svn_url: string;
    homepage: string | null;
    size: number;
    stargazers_count: number;
    watchers_count: number;
    language: string | null;
    has_issues: boolean;
    has_projects: boolean;
    has_downloads: boolean;
    has_wiki: boolean;
    has_pages: boolean;
    forks_count: number;
    mirror_url: string | null;
    archived: boolean;
    open_issues_count: number;
    license: APILicense | null;
    forks: number;
    open_issues: number;
    watchers: number;
    default_branch: string;
    organization?: APIOwnerOrOrg;
    network_count: number;
    subscribers_count: number;

    // Additional props
    readme_url?: string;
}

export interface LangsRepositories {
    [lang: string]: APIRepository[];
}

export interface ScraperConfig {
    proxy?: string;
    useGzip?: boolean;
}

export interface Language {
    color: string;
    aliases?: string[];
}

export interface Languages {
    [lang: string]: Language;
}

export interface ScrapedRepository {
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

export interface RepoSlug {
    name: string;
    owner: string;
}

const RE_HREF_SCRAPE = /^\/([^\/]+)\/([^\/]+)$/;
const RE_DIGITS = /\d+/;
const RE_COMMA = /,/g;

export class Scraper {
    config: ScraperConfig;
    private cache: Languages | null;

    constructor(config?: ScraperConfig) {
        this.config = config || {};
        if (this.config.useGzip === undefined) {
            this.config.useGzip = true;
        }
        this.cache = null;
    }

    fetchRequest(opts: request.Options) {
        if (this.config.proxy) {
            opts.proxy = this.config.proxy;
        }

        if (this.config.useGzip) {
            opts.gzip = true;
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

    fetchTrendPage(lang: string) {
        const opts: request.Options = {
            url: 'https://github.com/trending',
        };

        if (lang) {
            opts.url += '?l=' + lang;
        }

        return this.fetchRequest(opts);
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
                } as ScrapedRepository;

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

    scrapeTrendingRepos(lang: string) {
        return this.fetchTrendPage(lang).then((html: string) => {
            const repos: RepoSlug[] = [];
            const dom = cheerio.load(html);
            const items = dom('.repo-list li');
            /* tslint:disable:prefer-for-of */
            for (let i = 0; i < items.length; i++) {
                /* tslint:enable:prefer-for-of */
                const li = items[i];
                const a = dom(li).find('h3 a')[0];
                const href: string = a.attribs.href;
                const match = href.match(RE_HREF_SCRAPE);
                if (match) {
                    repos.push({
                        owner: match[1],
                        name: match[2],
                    });
                }
            }
            return repos;
        });
    }

    fetchLanguageYAML() {
        if (this.cache !== null) {
            return Promise.resolve(this.cache);
        }

        const opts: request.Options = {
            url: 'https://raw.githubusercontent.com/github/linguist/master/lib/linguist/languages.yml',
        };

        return this.fetchRequest(opts).then(body => {
            const langs = yaml.safeLoad(body) as Languages;
            this.cache = langs;
            return langs;
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

export type ClientConfig = ScraperConfig & {
    token?: string;
    useCodeHubInternalAPI?: boolean;
};

export class Client {
    scraper: Scraper;
    config: ClientConfig | null;

    constructor(config?: ClientConfig, token?: string) {
        this.scraper = new Scraper(config);
        this.config = config || {};
        this.config.token = token || (config || {}).token || null;
        if (token !== undefined) {
            /* tslint:disable:no-console */
            console.warn(
                'github-trend: The second parameter of constructor of Trending.Client class is deprecated.' +
                    ' Please use token property of the config passed to the first parameter.',
            );
            /* tslint:enable:no-console */
        }
    }

    fetchGetRepoAPI(repo: RepositoryEntry) {
        const headers: { [h: string]: string } = {
            'User-Agent': 'request',
            Accept: 'application/vnd.github.v3+json',
        };

        if (this.config.token) {
            headers.Authorization = 'token ' + this.config.token;
        }

        const opts: request.Options = {
            url: `https://api.github.com/repos/${repo.owner}/${repo.name}`,
            headers,
        };

        return this.scraper.fetchRequest(opts).then(body => JSON.parse(body));
    }

    fetchTrending(lang: string) {
        if (this.config.useCodeHubInternalAPI) {
            // XXX: Internal API. It may be changed suddenly.
            let url = 'http://trending.codehub-app.com/v2/trending';
            if (lang !== '' && lang !== 'all') {
                url += '?language=' + lang;
            }
            return this.scraper.fetchRequest({ url }).then(text => JSON.parse(text));
        }
        return this.scraper.scrapeTrendingRepos(lang).then((repos: RepositoryEntry[]) => {
            return Promise.all(repos.map(r => this.fetchGetRepoAPI(r)));
        });
    }

    fetchAppendingReadme(repo: APIRepository) {
        const readme_url = `${repo.html_url}/blob/${repo.default_branch}/README.md`;
        const opts: request.Options = {
            url: readme_url,
            method: 'HEAD',
        };

        return this.scraper
            .fetchRequest(opts)
            .then(() => {
                // Fetch did not fail. README.md exists.
                repo.readme_url = readme_url;
                return repo;
            })
            .catch(() => repo);
    }

    fetchTrendingWithReadme(lang: string) {
        return this.fetchTrending(lang).then((repos: APIRepository[]) => {
            return Promise.all(repos.map(r => this.fetchAppendingReadme(r)));
        });
    }

    fetchTrendingsWithReadme(langs: string[]) {
        return Promise.all(langs.map(l => this.fetchTrendingWithReadme(l))).then((trendings: APIRepository[][]) => {
            const result: LangsRepositories = {};
            langs.forEach((lang, idx) => {
                result[lang] = trendings[idx];
            });
            return result;
        });
    }

    fetchTrendings(langs: string[]) {
        return Promise.all(langs.map(l => this.fetchTrending(l))).then((trendings: APIRepository[][]) => {
            const result: LangsRepositories = {};
            langs.forEach((lang, idx) => {
                result[lang] = trendings[idx];
            });
            return result;
        });
    }
}
