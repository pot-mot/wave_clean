import katex, {type KatexOptions} from 'katex';

const cache = new Map<string, string>();

export const cleanKatexCache = () => {
    cache.clear();
};

export const renderKatex = (rawCode: string, options: KatexOptions): string => {
    const key = `[ ${options.displayMode} ] - ${rawCode}`;
    let rendered = cache.get(key);
    if (rendered === undefined) {
        rendered = katex.renderToString(rawCode, options);
        cache.set(key, rendered);
    }
    return rendered;
};
