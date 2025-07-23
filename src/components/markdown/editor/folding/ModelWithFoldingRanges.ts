import {editor, languages} from "monaco-editor/esm/vs/editor/editor.api.js"
import IModel = editor.IModel
import FoldingRange = languages.FoldingRange;

export type ModelWithFoldingRanges = IModel & {
    foldingRanges?: FoldingRange[]
}

export const setFoldingRanges = (model: IModel, ranges: FoldingRange[]) => {
    (model as ModelWithFoldingRanges).foldingRanges = ranges
}

export const getFoldingRanges = (model: IModel) => {
    return (model as ModelWithFoldingRanges).foldingRanges ?? []
}

export const getCurrentFoldingRange = (lineNumber: number, ranges: FoldingRange[]) => {
    return ranges.find(range => range.start <= lineNumber && range.end >= lineNumber)
}