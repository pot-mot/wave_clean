import {languages} from "monaco-editor/esm/vs/editor/editor.api.js";
type FoldingRangeProvider = languages.FoldingRangeProvider
type FoldingRange = languages.FoldingRange
import {setFoldingRanges} from "@/components/markdown/editor/folding/ModelWithFoldingRanges.ts";

type FoldingBlock = {
    // 起始行匹配正则
    startReg: RegExp | ((line: string) => RegExp | undefined)
    // 生成结束正则（可基于起始行内容）
    endReg: RegExp | ((line: string, match: RegExpMatchArray) => RegExp | undefined)
}

const getFoldingBlockEnd = (
    foldingBlock: FoldingBlock,
    lines: string[],
    i: number,
): number | undefined => {
    const line = lines[i]
    if (line === undefined) return

    const startReg = typeof foldingBlock.startReg === 'function'
        ? foldingBlock.startReg(line)
        : foldingBlock.startReg
    if (!startReg) return

    const match = line.match(startReg)
    if (!match) return

    const endReg = typeof foldingBlock.endReg === 'function'
        ? foldingBlock.endReg(line, match)
        : foldingBlock.endReg;

    if (!endReg) return
    for (let j = i + 1; j < lines.length; j++) {
        const endLine = lines[j]
        if (endLine !== undefined && endReg.test(endLine)) {
            return j;
        }
    }
}

const markdownFoldingBlocks: FoldingBlock[] = [
    {
        startReg: /^(\s*)(```|~~~)/,
        endReg: (_line, match) => {
            const indent = match[1]
            const delimiter = match[2]
            return new RegExp(`^${indent}${delimiter}`);
        },
    },
    {
        startReg: /^(\s*)\$\$/,
        endReg: (_line, match) => {
            const indent = match[1]
            return new RegExp(`^${indent}\\$\\$`);
        },
    },
    {
        startReg: (line) => {
            if (/-->$/.test(line)) return
            return /^(\s*)<!--/
        },
        endReg: /-->$/,
    },
    {
        startReg: /.*!\[.*]\(/,
        endReg: /\)/
    }
]

const imageDataUrlReg = /^(\s*)data:image\/.*;base64,/

export const markdownFoldingRangeProvider: FoldingRangeProvider = {
    provideFoldingRanges: (model) => {
        const ranges: FoldingRange[] = []
        const lines = model.getLinesContent()

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i]
            if (line === undefined) continue
            if (imageDataUrlReg.test(line)) continue

            for (const block of markdownFoldingBlocks) {
                const result = getFoldingBlockEnd(block, lines, i)
                if (result !== undefined) {
                    ranges.push({start: i + 1, end: result})
                    i = result
                    break
                }
            }
        }

        setFoldingRanges(model, ranges)

        return ranges
    }
}