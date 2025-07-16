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

        const lineNumbers: string[] = []
        const codeLines = renderedCode.split('\n')
        if (renderedCode.length > 0) {
            for (let i = 1; i < codeLines.length; i++) {
                lineNumbers.push(String(i));
            }
            if (codeLines[codeLines.length - 1].trim().length > 0) {
                lineNumbers.push(String(codeLines.length))
            }
        }

        return `
<div class="code-block">
    <div class="line-numbers">${lineNumbers.join('\n')}</div>
    <pre class="${language.length > 0 ? `language-${language}` : ''}"><code>${codeLines.join('\n')}</code></pre>
    <button class="code-copy-button" title="copy"></button>
    <div class="code-language">${language}</div>
</div>
`.trim()
    } catch (e) {
        const lineNumbers: string[] = []
        const codeLines = rawCode.split('\n')
        if (rawCode.length > 0) {
            for (let i = 1; i < codeLines.length; i++) {
                lineNumbers.push(String(i));
            }
            if (codeLines[codeLines.length - 1].trim().length > 0) {
                lineNumbers.push(String(codeLines.length))
            }
        }

        return `
<div class="code-block error">
    <div class="line-numbers">${lineNumbers.join('\n')}</div>
    <pre class="${language.length > 0 ? `language-${language}` : ''}"><code>${rawCode}</code></pre>
    <div class="error-detail">${e}</div>
    <button class="code-copy-button" title="copy"></button>
    <div class="code-language">${language}</div>
</div>
`.trim()
    }
}

export const copyButtonFindCodeBlockPre = (element: Element): HTMLElement | null => {
    const codeBlock = element.closest('.code-block')
    if (codeBlock) {
        return codeBlock.querySelector('pre')
    }
    return null
}

const renderCodeBlock = (text: string, language: string = ''): string => {
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
        const language = token.info.toLowerCase().trim()
        return renderCodeBlock(token.content, language)
    }

    md.renderer.rules.code_block = (tokens, idx) => {
        const token = tokens[idx]
        return renderCodeBlock(token.content)
    }
}
