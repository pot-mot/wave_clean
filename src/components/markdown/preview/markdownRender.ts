import MarkdownIt from "markdown-it";
import MermaidIt from "mermaid-it-markdown";
import "katex/dist/katex.min.css"
import {MarkdownItKatex} from "@/components/markdown/preview/plugins/MarkdownItKatex.ts";

const md = new MarkdownIt({
    html: true,
    linkify: true
})

md.use(MermaidIt)
md.use(MarkdownItKatex)

export {
    md
}