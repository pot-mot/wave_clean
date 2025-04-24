const canvas = document.createElement('canvas')
const context = canvas.getContext('2d')!

export const getTextLineSize = (text: string, targetEl: HTMLElement) => {
    const computedStyle = window.getComputedStyle(targetEl)
    context.font = computedStyle.font
    const metrics = context.measureText(text)
    const width = metrics.width
    const height =
        metrics.actualBoundingBoxAscent +
        metrics.actualBoundingBoxDescent

    return {width, height}
}

export const getTextBlockWidth = (text: string, targetEl: HTMLElement) => {
    const computedStyle = window.getComputedStyle(targetEl)
    context.font = computedStyle.font
    const lines = text.split('\n')
    return Math.max(
        ...lines.map(line => context.measureText(line).width)
    )
}
