declare module 'gzip-js' {
    export interface ZipOptions {
        level?: number;
        name?: string;
    }
    export function zip(data: string, opts?: ZipOptions): number[];
    export function unzip(data: number[] | Buffer): number[];
    export const DEFAULT_LEVEL: number;
}
