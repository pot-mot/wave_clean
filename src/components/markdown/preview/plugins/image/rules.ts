import type {VNodeRuleRecord} from '@/components/markdown/preview/render/VNodeRuleRecord.ts';
import {createVNode} from 'vue';
import {renderAttrs} from '@/components/markdown/preview/render/renderTokenToVNode.ts';

export const imageRules: VNodeRuleRecord = {
    image: (tokens, idx) => {
        const token = tokens[idx];
        if (!token) return;

        return createVNode('img', {
            ...renderAttrs(token),
            onload: "this.classList.remove('error');",
            onerror: "this.classList.add('error');",
            alt: token.content,
        });
    },
};
