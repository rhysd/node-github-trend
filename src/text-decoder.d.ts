interface TextDecoderOptions {
    fatal?: boolean;
    ignoreBOM?: boolean;
}

declare class TextDecoder {
    encoding: string;
    fatal: boolean;
    ignoreBOM: boolean;
    constructor(utfLabel?: string, options?: TextDecoderOptions);
    decode(input?: ArrayBufferView, options?: TextDecoderOptions): string;
}

interface Window {
    TextDecoder: typeof TextDecoder;
}
