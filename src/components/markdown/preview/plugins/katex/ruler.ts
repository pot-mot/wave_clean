import type StateInline from 'markdown-it/lib/rules_inline/state_inline.mjs';
import type Token from 'markdown-it/lib/token.mjs';
import type StateBlock from 'markdown-it/lib/rules_block/state_block.mjs';
import {MATH_BLOCK, MATH_INLINE} from './index.ts';

export const mathInline = (state: StateInline, silent: boolean): boolean => {
    let token: Token;
    let start: number;
    let match: number;
    let pos: number;

    if (state.src[state.pos] != '$') {
        return false;
    }

    // 首先查找并忽略所有正确转义的定界符
    // 这个循环要假设第一个反引号不能是 state.src 中的开头字符，这是已知的，因为我们已经找到了一个开启的定界符。
    start = state.pos + 1;
    match = start;
    while ((match = state.src.indexOf('$', match)) != -1) {
        // 找到了潜在的 $，查找转义字符，pos 将指向第一个非转义字符
        pos = match - 1;
        while (state.src[pos] == '\\') {
            pos -= 1;
        }

        // 转义字符数是偶数，找到了可能的结束定界符
        if ((match - pos) % 2 == 1) {
            break;
        }
        match += 1;
    }

    // 没找到结束定界符。消耗 $ 并继续。
    if (match == -1) {
        if (!silent) {
            state.pending += '$';
        }
        state.pos = start;
        return true;
    }

    // 检查是否为空内容，例如：$$. 不解析。
    if (match - start == 0) {
        if (!silent) {
            state.pending += '$$';
        }
        state.pos = start + 1;
        return true;
    }

    if (!silent) {
        token = state.push(MATH_INLINE, '', 0);
        token.markup = '$';
        token.content = state.src.slice(start, match);
    }

    state.pos = match + 1;
    return true;
};
export const mathBlock = (
    state: StateBlock,
    start: number,
    end: number,
    silent: boolean,
): boolean => {
    let firstLine: string = '';
    let lastLine: string = '';
    let next: number;
    let lastPos: number;
    let found: boolean = false;
    let token: Token;

    let pos: number = state.bMarks[start]! + state.tShift[start]!;
    let max: number = state.eMarks[start]!;

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

    for (next = start; !found; ) {
        next++;

        if (next >= end) {
            break;
        }

        pos = state.bMarks[next]! + state.tShift[next]!;
        max = state.eMarks[next]!;

        if (pos < max && state.tShift[next]! < state.blkIndent) {
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

    token = state.push(MATH_BLOCK, '', 0);
    token.block = true;
    token.content =
        (firstLine && firstLine.trim() ? firstLine + '\n' : '') +
        state.getLines(start + 1, next, state.tShift[start]!, true) +
        (lastLine && lastLine.trim() ? lastLine : '');
    token.map = [start, state.line];
    token.markup = '$$';
    return true;
};
