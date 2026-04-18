import MarkdownIt from 'markdown-it';
import {imageRules} from './rules.ts';

export const MarkdownItImage = (md: MarkdownIt) => {
    Object.assign(md.renderer.rules, imageRules);
};
