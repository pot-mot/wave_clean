import MarkdownIt from 'markdown-it';
import {linkRules} from './rules.ts';

export const MarkdownItLink = (md: MarkdownIt) => {
    Object.assign(md.renderer.rules, linkRules);
};
