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
    description: string;
    language: string;
    allStars: string;
    todaysStars: string;
    [k: string]: string | number;
}
export declare class Scraper {
    config: ScraperConfig;
    cache: Object;
    constructor(config?: ScraperConfig);
    fetchTrendPage(lang_name: string): Promise<{}>;
    scrapeTrendingReposFullInfo(lang_name: string): Promise<FullRepository[]>;
    scrapeTrendingRepos(lang_name: string): Promise<{
        owner: string;
        name: string;
    }[]>;
    fetchLanguageYAML(): Promise<{}>;
    scrapeLanguageColors(): Promise<{
        [key: string]: string;
    }>;
    scrapeLanguageNames(): Promise<string[]>;
}
export declare class Client {
    scraper: Scraper;
    token: string;
    constructor(config?: ScraperConfig, token?: string);
    fetchGetAPI(repo: RepositoryEntry): Promise<{}>;
    fetchTrending(lang: string): Promise<Repository[]>;
    fetchAppendingReadme(repo: {
        [key: string]: any;
    }): Promise<{}>;
    fetchTrendingWithReadme(lang: string): Promise<Repository[]>;
    fetchTrendingsWithReadme(langs: string[]): Promise<Repositories>;
    fetchTrendings(langs: string[]): Promise<Repositories>;
}
