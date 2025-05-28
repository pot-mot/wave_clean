import {Position} from "@vue-flow/core";

function calculateControlOffset(distance: number, curvature: number) {
    if (distance >= 0) {
        return 0.5 * distance + curvature * 60
    } else {
        return curvature * 25 * Math.sqrt(-distance)
    }
}

interface GetControlWithCurvatureParams {
    pos: Position
    x1: number
    y1: number
    x2: number
    y2: number
    c: number
}

function getControlWithCurvature({pos, x1, y1, x2, y2, c}: GetControlWithCurvatureParams): [number, number] {
    let ctX: number, ctY: number
    switch (pos) {
        case Position.Left:
            ctX = x1 - calculateControlOffset(x1 - x2, c)
            ctY = y1
            break
        case Position.Right:
            ctX = x1 + calculateControlOffset(x2 - x1, c)
            ctY = y1
            break
        case Position.Top:
            ctX = x1
            ctY = y1 - calculateControlOffset(y1 - y2, c)
            break
        case Position.Bottom:
            ctX = x1
            ctY = y1 + calculateControlOffset(y2 - y1, c)
            break
    }
    return [ctX, ctY]
}

interface GetBezierPathParams {
    sourceX: number
    sourceY: number
    sourcePosition?: Position
    targetX: number
    targetY: number
    targetPosition?: Position
    curvature?: number
}

export const getPaddingBezierPath = (
    bezierPathParams: GetBezierPathParams,
    sourcePadding: number = 8,
    targetPadding: number = 8,
): string => {
    const {
        sourceX,
        sourceY,
        sourcePosition = Position.Bottom,
        targetX,
        targetY,
        targetPosition = Position.Top,
        curvature = 0.25,
    } = bezierPathParams

    // 新增：startX/startY 是 source 前的偏移点
    let startX = sourceX
    let startY = sourceY
    switch (sourcePosition) {
        case Position.Left:
            startX = sourceX - sourcePadding
            break
        case Position.Right:
            startX = sourceX + sourcePadding
            break
        case Position.Top:
            startY = sourceY - sourcePadding
            break
        case Position.Bottom:
            startY = sourceY + sourcePadding
            break
    }

    // 新增：endX/endY 是 target 后的偏移点
    let endX = targetX
    let endY = targetY
    switch (targetPosition) {
        case Position.Left:
            endX = targetX - targetPadding
            break
        case Position.Right:
            endX = targetX + targetPadding
            break
        case Position.Top:
            endY = targetY - targetPadding
            break
        case Position.Bottom:
            endY = targetY + targetPadding
            break
    }

    const [sourceControlX, sourceControlY] = getControlWithCurvature({
        pos: sourcePosition,
        x1: startX,
        y1: startY,
        x2: endX,
        y2: endY,
        c: curvature,
    })

    const [targetControlX, targetControlY] = getControlWithCurvature({
        pos: targetPosition,
        x1: endX,
        y1: endY,
        x2: startX,
        y2: startY,
        c: curvature,
    })

    // 构建带 padding 的完整路径
    return `
        M${sourceX},${sourceY}
        L${startX},${startY}
        C${sourceControlX},${sourceControlY} ${targetControlX},${targetControlY} ${endX},${endY}
        L${targetX},${targetY}`
}
