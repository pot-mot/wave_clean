import type {VNodeRuleRecord} from '@/components/markdown/preview/render/VNodeRuleRecord.ts';
import {createVNode, type VNode} from 'vue';
import {katexLanguages, mermaidLanguages} from './render.ts';
import MarkdownCode from './MarkdownCode.vue';
import MarkdownMermaidBlock from '@/components/markdown/preview/plugins/mermaid/MarkdownMermaidBlock.vue';
import MarkdownKatexBlock from '@/components/markdown/preview/plugins/katex/MarkdownKatexBlock.vue';

const renderCodeBlock = (code: string, language: string): VNode | string => {
    if (mermaidLanguages.has(language)) {
        return createVNode(MarkdownMermaidBlock, {code});
    } else if (katexLanguages.has(language)) {
        return createVNode(MarkdownKatexBlock, {code});
    } else {
        return createVNode(MarkdownCode, {code, language});
    }
};

export const MarkdownCodeVNodeRules: VNodeRuleRecord = {
    fence: (tokens, idx) => {
        const token = tokens[idx];
        if (!token) return;
        const language = token.info.toLowerCase().trim();
        return renderCodeBlock(token.content, language);
    },
    code_block: (tokens, idx) => {
        const token = tokens[idx];
        if (!token) return;
        return renderCodeBlock(token.content, '');
    },
};
