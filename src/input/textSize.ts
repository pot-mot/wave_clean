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

const lineHeightComputeSpan = document.createElement('span');
lineHeightComputeSpan.innerText = 'a'
lineHeightComputeSpan.style.position = 'absolute'
lineHeightComputeSpan.style.visibility = 'hidden'
document.body.appendChild(lineHeightComputeSpan)

export const getTextBlockWidth = (text: string, targetEl: HTMLElement) => {
    const computedStyle = window.getComputedStyle(targetEl)
    context.font = computedStyle.font
    const lines = text.split('\n')
    const width = Math.max(
        ...lines.map(line => context.measureText(line).width)
    )

    lineHeightComputeSpan.style.font = computedStyle.font
    lineHeightComputeSpan.style.lineHeight = computedStyle.lineHeight
    const lineHeight = lineHeightComputeSpan.offsetHeight
    const height = lineHeight * lines.length
    console.log(lineHeight)

    return {width, height}
}
