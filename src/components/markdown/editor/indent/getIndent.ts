const indentRegex = /^\s*/
export const getIndent = (line: string): string => {
    const indentMatch = line.match(indentRegex)
    return indentMatch ? indentMatch[0] : ''
}