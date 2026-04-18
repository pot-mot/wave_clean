import MarkdownIt from 'markdown-it';
import {MarkdownCodeVNodeRules} from './rules.ts';

export const MarkdownItCode = (md: MarkdownIt) => {
    Object.assign(md.renderer.rules, MarkdownCodeVNodeRules);
};
