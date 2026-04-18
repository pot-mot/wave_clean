import MarkdownIt from 'markdown-it';
import 'katex/dist/katex.min.css';
import {mathBlock, mathInline} from './ruler.ts';
import {createKatexRules} from './rules.ts';

export const MATH_INLINE = 'math_inline';
export const MATH_BLOCK = 'math_block';

export const MarkdownItKatex = (md: MarkdownIt) => {
    Object.assign(md.renderer.rules, createKatexRules());

    md.inline.ruler.after('escape', MATH_INLINE, mathInline);
    md.block.ruler.after('blockquote', MATH_BLOCK, mathBlock, {
        alt: ['paragraph', 'reference', 'blockquote', 'list'],
    });
};
