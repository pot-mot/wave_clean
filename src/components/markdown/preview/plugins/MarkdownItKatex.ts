import MarkdownIt from 'markdown-it';
// @ts-ignore
import StateInline from "markdown-it/lib/rules_inline/state_inline";
// @ts-ignore
import StateBlock from "markdown-it/lib/rules_block/state_block";
import katex, {KatexOptions} from 'katex';
import "katex/dist/katex.min.css"

export const mathInline = (state: StateInline, silent: boolean): boolean => {
    let start, match, token, pos;

    if (state.src[state.pos] != "$") {
        return false;
    }

    // 首先查找并忽略所有正确转义的定界符
    // 这个循环要假设第一个反引号不能是 state.src 中的开头字符，这是已知的，因为我们已经找到了一个开启的定界符。
    start = state.pos + 1;
    match = start;
    while ((match = state.src.indexOf("$", match)) != -1) {
        // 找到了潜在的 $，查找转义字符，pos 将指向第一个非转义字符
        pos = match - 1;
        while (state.src[pos] == "\\") {
            pos -= 1;
        }

        // 转义字符数是偶数，找到了可能的结束定界符
        if (((match - pos) % 2) == 1) {
            break;
        }
        match += 1;
    }

    // 没找到结束定界符。消耗 $ 并继续。
    if (match == -1) {
        if (!silent) {
            state.pending += "$";
        }
        state.pos = start;
        return true;
    }

    // 检查是否为空内容，例如：$$. 不解析。
    if (match - start == 0) {
        if (!silent) {
            state.pending += "$$";
        }
        state.pos = start + 1;
        return true;
    }

    if (!silent) {
        token = state.push('math_inline', 'math', 0);
        token.markup = "$";
        token.content = state.src.slice(start, match);
    }

    state.pos = match + 1;
    return true;
}

export const mathBlock = (state: StateBlock, start: number, end: number, silent: boolean): boolean => {
    let firstLine, lastLine, next, lastPos, found = false, token,
        pos = state.bMarks[start] + state.tShift[start],
        max = state.eMarks[start]

    if (pos + 2 > max) {
        return false;
    }
    if (state.src.slice(pos, pos + 2) != '$$') {
        return false;
    }

    pos += 2;
    firstLine = state.src.slice(pos, max);

    if (silent) {
        return true;
    }
    if (firstLine.trim().slice(-2) == '$$') {
        // Single line expression
        firstLine = firstLine.trim().slice(0, -2);
        found = true;
    }

    for (next = start; !found;) {

        next++;

        if (next >= end) {
            break;
        }

        pos = state.bMarks[next] + state.tShift[next];
        max = state.eMarks[next];

        if (pos < max && state.tShift[next] < state.blkIndent) {
            // non-empty line with negative indent should stop the list:
            break;
        }

        if (state.src.slice(pos, max).trim().slice(-2) == '$$') {
            lastPos = state.src.slice(0, max).lastIndexOf('$$');
            lastLine = state.src.slice(pos, lastPos);
            found = true;
        }

    }

    state.line = next + 1;

    token = state.push('math_block', 'math', 0);
    token.block = true;
    token.content = (firstLine && firstLine.trim() ? firstLine + '\n' : '')
        + state.getLines(start + 1, next, state.tShift[start], true)
        + (lastLine && lastLine.trim() ? lastLine : '');
    token.map = [start, state.line];
    token.markup = '$$';
    return true;
}

const cache = new Map<string, string>

const getRenderKatex = (text: string, options?: KatexOptions): string => {
    if (cache.has(text)) {
        return cache.get(text)!;
    } else {
        const result = katex.renderToString(text, options);
        cache.set(text, result);
        return result;
    }
}

export const renderKatexInline = (content: string, options?: KatexOptions): string => {
    const opts = Object.assign({}, options)
    opts.displayMode = false;
    try {
        const result = getRenderKatex(content, opts);
        return `<span class="katex">${result}</span>`;
    } catch (e) {
        return `<span class="katex-error">katex render fail: ${content}\nbecause of error: ${e}</span>`;
    }
}

export const renderKatexBlock = (content: string, options?: KatexOptions): string => {
    const opts = Object.assign({}, options)
    opts.displayMode = true;
    try {
        const result = getRenderKatex(content, opts);
        return `<details><summary><div class="katex">${result}</div></summary><pre>${content}</pre></details>`;
    } catch (e) {
        return `<div class="katex-error">katex render fail: ${content}\nbecause of error: ${e}</div>`;
    }
}

export const MarkdownItKatex = (md: MarkdownIt, options: KatexOptions = {}) => {
    //@ts-ignore
    md.katexConfig = options;

    //@ts-ignore
    md.renderer.rules['math_inline'] = (tokens: Token[], idx: number) => {
        return renderKatexInline(tokens[idx].content, options);
    }
    //@ts-ignore
    md.renderer.rules['math_block'] = (tokens: Token[], idx: number) => {
        return renderKatexBlock(tokens[idx].content, options);
    }

    md.inline.ruler.after('escape', 'math_inline', mathInline);
    md.block.ruler.after('blockquote', 'math_block', mathBlock, {
        alt: ['paragraph', 'reference', 'blockquote', 'list']
    });
}