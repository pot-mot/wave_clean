import MarkdownIt from "markdown-it";
import MermaidIt from "mermaid-it-markdown";
import {MarkdownItKatex} from "@/components/markdown/preview/plugins/MarkdownItKatex.ts";
//@ts-ignore
import MarkdownItSub from 'markdown-it-sub';
//@ts-ignore
import MarkdownItSup from 'markdown-it-sup';
//@ts-ignore
import MarkdownItMark from 'markdown-it-mark';
//@ts-ignore
import {full as MarkdownItEmoji} from 'markdown-it-emoji';
// @ts-ignore
import MarkdownItTaskLists from 'markdown-it-task-lists';
import MarkdownItMultiMdTable from 'markdown-it-multimd-table';
import {MarkdownItLink} from "@/components/markdown/preview/plugins/MarkdownItLink.ts";
import {MarkdownItImage} from "@/components/markdown/preview/plugins/MarkdownItImage.ts";

const md = new MarkdownIt({
    html: true,
    linkify: true
})

md
    .use(MarkdownItLink)
    .use(MarkdownItImage)
    .use(MarkdownItSub)
    .use(MarkdownItSup)
    .use(MarkdownItMark)
    .use(MarkdownItEmoji)
    .use(MarkdownItTaskLists)
    .use(MarkdownItKatex, {strict: false})
    .use(MarkdownItMultiMdTable, {multiline: true, rowspan: true, headerless: true,})
    .use(MermaidIt)

export {
    md
}