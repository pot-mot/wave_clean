import {renderKatexBlock} from "@/components/markdown/preview/plugins/MarkdownItKatex.ts"
import {renderMermaidBlock} from "@/components/markdown/preview/plugins/MarkdownItMermaid.ts"
import Prism from "prismjs";
import MarkdownIt from "markdown-it";

export const prismLanguages = new Set([
    'javascript', 'js', 'jsx', 'typescript', 'ts', "tsx",
    'css', 'css-extras', 'html', 'less', 'sass', 'scss',
    'svg', 'icon',
    'markup', "markdown", "md",
    'http', 'uri', 'url',
    'c', 'cpp', 'cmake', 'objc',
    'rust',
    'go',
    'php', 'phpdoc',
    'perl',
    'java', 'javadoc', 'groovy', 'kotlin', 'kt', 'kts', 'scala',
    'latex', 'tex', 'matlab',
    'sql', 'graphql', 'mongodb',
    'erlang',
    'lua',
    'python', 'py', 'django', 'jinja2',
    'csharp', 'dotnet',
    'cobol',
    'makefile',
    'mermaid',
    'json', 'json5', 'jsonp',
    'xml', 'yaml', 'yml', 'ini', 'toml',
    'bash', 'shell', 'batch',
    'docker', 'dockerfile',
    'git',
    'vim',
    'dns-zone',
    'log',
    'qml',
    'scheme',
    'swift'
])

export const katexLanguages = new Set([
    "math",
    "katex",
    "latex",
])

export const mermaidLanguages = new Set([
    "mermaid",
])

const cache: Map<string, string> = new Map

export const cleanPrismCache = () => {
    cache.clear()
}

const renderCodeWithLineNumbers = (code: string): string => {
    const counts: string[] = []
    let codes = code.split('\n');
    if (codes[codes.length - 1].length == 0) {
        codes = codes.slice(0, codes.length - 1);
    }
    for (let i = 0; i < codes.length; i++) {
        counts.push(`${i + 1}`);
    }
    return `<div class="count">${counts.join('\n')}</div>` +
        `<code>${codes.join('\n')}</code>`
}

export const renderPrismCodeBlock = (rawCode: string, language: string): string => {
    try {
        const key = `[ ${language} ]-[ ${rawCode} ]`

        let renderedCode = cache.get(key)
        if (renderedCode === undefined) {
            if (prismLanguages.has(language)) {
                renderedCode = Prism.highlight(rawCode, Prism.languages[language], language)
                cache.set(key, renderedCode)
            } else {
                renderedCode = rawCode
            }
        }

        return `
<pre class="${language ? `language-${language}` : ''}">
    ${renderCodeWithLineNumbers(renderedCode)}
    <button class="code-copy-button" title="复制"/>
    <div class="code-language">${language}</div>
</pre>
`.trim()
    } catch (e) {
        return `
<pre class="error ${language ? `language-${language}` : ''}">
    ${rawCode}
    <div class="error-detail">${e}</div>
</pre>
`.trim()
    }
}

const renderCodeBlock = (text: string, language: string): string => {
    if (mermaidLanguages.has(language)) {
        return renderMermaidBlock(text)
    } else if (katexLanguages.has(language)) {
        return renderKatexBlock(text)
    } else {
        return renderPrismCodeBlock(text, language)
    }
}

export const MarkdownItPrismCode = (md: MarkdownIt) => {
    md.renderer.rules.fence = (tokens, idx) => {
        const token = tokens[idx]
        const language = token.info.trim()
        return renderCodeBlock(token.content, language)
    }
}