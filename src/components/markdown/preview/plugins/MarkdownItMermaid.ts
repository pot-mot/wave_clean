import mermaid, {type MermaidConfig} from "mermaid"
import {renderPrismCodeBlock} from "@/components/markdown/preview/plugins/MarkdownItPrismCode.ts";
import {v7 as uuid} from "uuid"
import {type Theme} from "@tauri-apps/api/window";

const defaultOptions: MermaidConfig = {
    startOnLoad: false,
    flowchart: {
        htmlLabels: true
    },
}

mermaid.initialize(defaultOptions)

const cache = new Map<string, string>

export const cleanMermaidCache = () => {
    cache.clear()
}

export const setMermaidTheme = (newTheme: Theme) => {
    mermaid.initialize({
        ...defaultOptions,
        theme: newTheme === 'dark' ? 'dark' : 'default'
    })
}

const renderMermaid = async (
    id: string,
    rawCode: string
) => {
    const element = document.getElementById(id)
    if (!element) return

    if (!element.classList.contains('mermaid-wait')) return

    try {
        const renderId = `rendering-${id}`
        const renderElement = document.createElement('div')
        renderElement.id = renderId
        const result = await mermaid.render(renderId, rawCode)
        renderElement.remove()
        cache.set(rawCode, result.svg)
        element.outerHTML = `
<div class="mermaid">${result.svg}</div>
<details class="mermaid-source-code">
    <summary>Source Code</summary>
    ${renderPrismCodeBlock(rawCode, 'mermaid')}
</details>
`.trim()
    } catch (e) {
        const error = document.getElementById('d' + id)
        if (error) {
            error.remove()
        }
        element.outerHTML = `
<div class="mermaid error">
    ${renderPrismCodeBlock(rawCode, 'mermaid')}
    <div class="error-detail">${e}</div>
</div>
`.trim()
    }
}

export const renderMermaidBlock = (rawCode: string): string => {
    let renderedCode = cache.get(rawCode)
    if (renderedCode === undefined) {
        const id = `mermaid-${uuid()}`
        setTimeout(async () => {
            await renderMermaid(id, rawCode)
        }, 0)
        return `<div id="${id}" class="mermaid-wait">${rawCode}</div>`
    } else {
        return `
<div class="mermaid">${renderedCode}</div>
<details class="mermaid-source-code">
    <summary>Source Code</summary>
    ${renderPrismCodeBlock(rawCode, 'mermaid')}
</details>
`.trim()
    }
}
