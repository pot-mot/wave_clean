import type {VNodeRuleRecord} from '@/components/markdown/preview/render/VNodeRuleRecord.ts';
import {MATH_BLOCK, MATH_INLINE} from './index.ts';
import {createVNode} from 'vue';
import MarkdownKatexInline from './MarkdownKatexInline.vue';
import MarkdownKatexBlock from './MarkdownKatexBlock.vue';

export const createKatexRules = () => {
    const katexRules: VNodeRuleRecord = {};

    katexRules[MATH_INLINE] = (tokens, index) => {
        const token = tokens[index];
        if (!token) return;
        return createVNode(MarkdownKatexInline, {code: token.content});
    };

    katexRules[MATH_BLOCK] = (tokens, index) => {
        const token = tokens[index];
        if (!token) return;
        return createVNode(MarkdownKatexBlock, {code: token.content});
    };

    return katexRules;
};
