import {Comment, createVNode, Fragment, Text, type VNode} from 'vue';
import {validateAttrName} from './validateAttrName';
import {setSourceLine} from './sourceLine.ts';
import {DOM_ATTR_NAME} from '@/components/markdown/preview/render/domAttrName.ts';
import {createHtmlVNode} from '@/components/markdown/preview/render/htmlVNode.ts';
import Renderer from 'markdown-it/lib/renderer.mjs';
import type Token from 'markdown-it/lib/token.mjs';
import {type Options} from 'markdown-it';
import type {VNodeRuleRecord} from '@/components/markdown/preview/render/VNodeRuleRecord.ts';

const defaultRender = (tokens: Token[], idx: number): VNode | undefined => {
    const token: Token | undefined = tokens[idx];
    if (token === undefined) return;

    if (token.nesting === -1) {
        return;
    }

    if (token.hidden) {
        return createVNode(Fragment, {}, []);
    }

    if (token.tag === '--') {
        return createVNode(Comment);
    }

    return createVNode(token.tag, renderAttrs(token), []);
};

export const renderAttrs = (token: Token): Record<string, string> => {
    if (!token.attrs) {
        return {};
    }

    const result: Record<string, string> = {};

    token.attrs.forEach(([name, val]: [string, string]) => {
        if (validateAttrName(name)) {
            result[name] = val;
        }
    });

    return result;
};

export const renderTokenToVNode = (
    tokens: Token[],
    renderer: Renderer,
    options: Options,
    env?: Record<string, any>,
): VNode[] => {
    const vNodeParents: VNode[] = [];
    const rules: VNodeRuleRecord = renderer.rules as VNodeRuleRecord;

    return tokens
        .map((token, i) => {
            setSourceLine(token, env);
            if (token.block) {
                token.attrSet(DOM_ATTR_NAME.TOKEN_IDX, i.toString());
            }

            const type = token.type;

            let vNode: VNode | null | undefined = null;
            let parent: VNode | null | undefined = null;

            if (type === 'text') {
                vNode = createVNode(Text, {}, token.content);
            } else if (type === 'inline') {
                vNode = createVNode(
                    Fragment,
                    {},
                    renderTokenToVNode(token.children || [], renderer, options, env),
                );
            } else if (type === 'html_inline' || type === 'html_block') {
                vNode = createHtmlVNode(token.content);
            } else {
                const rule = rules[type];
                if (rule) {
                    const result = rule(tokens, i, options, env, renderer);
                    if (result) {
                        if (typeof result === 'string') {
                            vNode = createHtmlVNode(result);
                        } else if (typeof result === 'object' && 'node' in result) {
                            parent = result.parent;
                            vNode = result.node;
                        } else {
                            vNode = result;
                        }
                    }
                } else {
                    vNode = defaultRender(tokens, i);
                }
            }

            let isChild = false;
            const parentNode =
                vNodeParents.length > 0 ? vNodeParents[vNodeParents.length - 1] : null;
            if (vNode && parentNode) {
                if (typeof parentNode.type === 'string' || parentNode.type === Fragment) {
                    const children = Array.isArray(parentNode.children) ? parentNode.children : [];
                    parentNode.children = children.concat([vNode]);
                }
                isChild = true;
            }

            if (token.nesting === 1) {
                if (parent) {
                    vNodeParents.push(parent);
                } else if (vNode) {
                    vNodeParents.push(vNode);
                }
            }

            if (token.nesting === -1) {
                vNodeParents.pop();
            }

            return isChild ? null : vNode;
        })
        .filter((node) => !!node);
};
