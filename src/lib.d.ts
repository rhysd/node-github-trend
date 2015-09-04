/// <reference path="../typings/tsd.d.ts" />

declare module GitHub {
    interface APIConfig {
        version: string;
    }

    interface GetAPIMessage {
        user: string;
        repo: string;
        headers?: Object;
    }

    interface GetAPI {
        get(msg: GetAPIMessage, callback: (err: Error, data: Object) => void): void;
    }

    class GitHubClient {
        repos: GetAPI;

        constructor(config: APIConfig);
    }
}

declare module "github" {
    var gh: typeof GitHub.GitHubClient;
    export = gh;
}
