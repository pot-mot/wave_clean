import MarkdownIt, {type Options} from 'markdown-it';
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
import {MarkdownItLink} from '@/components/markdown/preview/plugins/link';
import {MarkdownItImage} from '@/components/markdown/preview/plugins/image';
import {MarkdownItKatex} from '@/components/markdown/preview/plugins/katex';
import {cleanPrismCache} from '@/components/markdown/preview/plugins/code/render.ts';
import {renderTokenToVNode} from '@/components/markdown/preview/render/renderTokenToVNode.ts';
import {MarkdownItCode} from '@/components/markdown/preview/plugins/code';
import {cleanKatexCache} from '@/components/markdown/preview/plugins/katex/render.ts';
import {cleanMermaidCache} from '@/components/markdown/preview/plugins/mermaid/render.ts';

const markdownDefaultOptions: Options = {
    html: true,
    xhtmlOut: true,
    breaks: true,
    linkify: true,
};

export const md = new MarkdownIt(markdownDefaultOptions);

md.use(MarkdownItLink)
    .use(MarkdownItImage)
    .use(MarkdownItSub)
    .use(MarkdownItSup)
    .use(MarkdownItMark)
    .use(MarkdownItEmoji)
    .use(MarkdownItTaskLists)
    .use(MarkdownItCode)
    .use(MarkdownItKatex)
    .use(MarkdownItMultiMdTable, {multiline: true, rowspan: true, headerless: true});

md.renderer.render = (tokens, options, env) => {
    return renderTokenToVNode(tokens, md.renderer, options, env) as any;
};

export const cleanMarkdownRenderCache = () => {
    cleanMermaidCache();
    cleanKatexCache();
    cleanPrismCache();
};
