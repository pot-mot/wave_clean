import MarkdownIt, {Options} from "markdown-it";
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
import {MarkdownItKatex, cleanKatexCache} from "@/components/markdown/preview/plugins/MarkdownItKatex.ts";
import {cleanMermaidCache} from "@/components/markdown/preview/plugins/MarkdownItMermaid.ts";
import {MarkdownItPrismCode, cleanPrismCache} from "@/components/markdown/preview/plugins/MarkdownItPrismCode.ts";

const markdownDefaultOptions: Options = {
    html: true,
    xhtmlOut: true,
    breaks: true,
    linkify: true,
}

export const md = new MarkdownIt(markdownDefaultOptions)

md
    .use(MarkdownItLink)
    .use(MarkdownItImage)
    .use(MarkdownItSub)
    .use(MarkdownItSup)
    .use(MarkdownItMark)
    .use(MarkdownItEmoji)
    .use(MarkdownItTaskLists)
    .use(MarkdownItPrismCode)
    .use(MarkdownItKatex)
    .use(MarkdownItMultiMdTable, {multiline: true, rowspan: true, headerless: true})

export const cleanMarkdownRenderCache = () => {
    cleanMermaidCache()
    cleanKatexCache()
    cleanPrismCache()
}