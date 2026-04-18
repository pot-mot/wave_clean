import {validateAttrName} from './validateAttrName';
import {DOM_ATTR_NAME} from '@/components/markdown/preview/render/domAttrName.ts';
import type Token from 'markdown-it/lib/token.mjs';

const getLine = (token: Token, env?: Record<string, any>): [number, number] => {
    const [lineStart, lineEnd] = token.map || [0, 1];

    // macro, calc line offset, see `markdown-macro` plugin.
    let sOffset = 0;
    if (env?.macroLines && env.bMarks && env.eMarks) {
        const sPos = env.bMarks[lineStart];
        for (let i = 0; i < env.macroLines.length; i++) {
            const {matchPos, lineOffset, posOffset, currentPosOffset} = env.macroLines[i];
            if (sPos + posOffset > matchPos && sPos + posOffset - currentPosOffset > matchPos) {
                sOffset = lineOffset;
            } else {
                break;
            }
        }
    }

    return [lineStart + sOffset, lineEnd + sOffset];
};

export const setSourceLine = (token: Token, env?: Record<string, any>) => {
    if (!token.meta) {
        token.meta = {};
    }

    if (token.block) {
        const [lineStart, lineEnd] = getLine(token, env);

        if (token.map) {
            token.attrSet(DOM_ATTR_NAME.SOURCE_LINE_START, String(lineStart + 1));
            token.attrSet(DOM_ATTR_NAME.SOURCE_LINE_END, String(lineEnd + 1));
            if (!token.meta.attrs) {
                token.meta.attrs = {};
            }

            // transform array to object
            token.attrs?.forEach(([name, val]: [string, string]) => {
                // filter attrs
                if (validateAttrName(name)) {
                    token.meta.attrs[name] = val;
                }
            });
        }
    }
};
