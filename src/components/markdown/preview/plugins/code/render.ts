import Prism from 'prismjs';

export const prismLanguages = new Set([
    'javascript',
    'js',
    'jsx',
    'typescript',
    'ts',
    'tsx',
    'css',
    'css-extras',
    'html',
    'less',
    'sass',
    'scss',
    'svg',
    'icon',
    'markup',
    'markdown',
    'md',
    'http',
    'uri',
    'url',
    'c',
    'cpp',
    'cmake',
    'objc',
    'rust',
    'go',
    'php',
    'phpdoc',
    'perl',
    'java',
    'javadoc',
    'groovy',
    'kotlin',
    'kt',
    'kts',
    'scala',
    'latex',
    'tex',
    'matlab',
    'sql',
    'graphql',
    'mongodb',
    'erlang',
    'lua',
    'python',
    'py',
    'django',
    'jinja2',
    'csharp',
    'dotnet',
    'cobol',
    'makefile',
    'mermaid',
    'json',
    'json5',
    'jsonp',
    'xml',
    'yaml',
    'yml',
    'ini',
    'toml',
    'bash',
    'shell',
    'batch',
    'docker',
    'dockerfile',
    'git',
    'vim',
    'dns-zone',
    'log',
    'qml',
    'scheme',
    'swift',
]);

export const katexLanguages = new Set(['math', 'katex', 'latex']);

export const mermaidLanguages = new Set(['mermaid']);

export const allLanguages = new Set([...prismLanguages, ...katexLanguages, ...mermaidLanguages]);

const cache: Map<string, string> = new Map();

export const cleanPrismCache = () => {
    cache.clear();
};

export const renderCodeByPrism = (
    rawCode: string,
    language: string,
): {
    result: string;
    lineCount: number;
} => {
    try {
        const key = `[ ${language} ] - ${rawCode}`;

        let rendered = cache.get(key);
        if (rendered === undefined) {
            if (prismLanguages.has(language) && Prism.languages[language]) {
                rendered = Prism.highlight(rawCode, Prism.languages[language], language);
                cache.set(key, rendered);
            } else {
                rendered = rawCode;
            }
        }

        const codeLines = rendered.split('\n');
        let lineCount = Math.max(0, codeLines.length - 1);
        const lastLine = codeLines[codeLines.length - 1];
        if (lastLine && lastLine.trim().length > 0) {
            lineCount = codeLines.length;
        }

        return {
            result: rendered,
            lineCount,
        };
    } catch (e) {
        const codeLines = rawCode.split('\n');
        let lineCount = Math.max(0, codeLines.length - 1);
        const lastLine = codeLines[codeLines.length - 1];
        if (lastLine && lastLine.trim().length > 0) {
            lineCount = codeLines.length;
        }

        return {
            result: rawCode,
            lineCount,
        };
    }
};
