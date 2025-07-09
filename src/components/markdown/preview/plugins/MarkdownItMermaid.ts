import mermaid from "mermaid"
import {renderPrismCodeBlock} from "@/components/markdown/preview/plugins/MarkdownItPrismCode.ts";
import {v7 as uuid} from "uuid"

mermaid.initialize(
    {
        startOnLoad: false,
        flowchart: {
            htmlLabels: true
        },
    },
)

const cache = new Map<string, string>

const RawCodeAttr = "raw-code"

const renderMermaid = async (
    id: string,
) => {
    const element = document.getElementById(id)
    if (!element) return

    if (!element.classList.contains('mermaid-wait')) return

    const rawCode = element.getAttribute(RawCodeAttr)
    if (!rawCode) return

    try {
        const renderId = `rendering-${id}`
        const renderElement = document.createElement('div')
        renderElement.id = renderId
        const result = await mermaid.render(renderId, rawCode)
        renderElement.remove()
        cache.set(rawCode, result.svg)
        element.outerHTML = `
<details>
    <summary>
        <div class="mermaid">${result.svg}</div>
    </summary>
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
            await renderMermaid(id)
        }, 0)
        return `<div id="${id}" class="mermaid-wait" ${RawCodeAttr}="${rawCode}">${rawCode}</div>`
    } else {
        return `
<details>
    <summary>
        <div class="mermaid">${renderedCode}</div>
    </summary>
    ${renderPrismCodeBlock(rawCode, 'mermaid')}
</details>
`.trim()
    }
}
