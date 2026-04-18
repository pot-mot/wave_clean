import type {VNodeRuleRecord} from '@/components/markdown/preview/render/VNodeRuleRecord.ts';
import {createVNode} from 'vue';
import {renderAttrs} from '@/components/markdown/preview/render/renderTokenToVNode.ts';

export const linkRules: VNodeRuleRecord = {
    link_open: (tokens, idx) => {
        const token = tokens[idx];
        if (!token) return;

        return createVNode('a', {
            ...renderAttrs(token),
            target: '_blank',
        });
    },
};
