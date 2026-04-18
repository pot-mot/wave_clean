import Renderer from 'markdown-it/lib/renderer.mjs';
import type Token from 'markdown-it/lib/token.mjs';
import {type Options} from 'markdown-it';
import type {VNode} from 'vue';

export type VNodeRule = (
    tokens: Token[],
    index: number,
    options: Options,
    env: Record<string, any> | undefined,
    renderer: Renderer,
) => VNode | {parent: VNode; node: VNode} | string | null | undefined;

export type VNodeRuleRecord = Record<string, VNodeRule>;
