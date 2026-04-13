import {Position, type XYPosition} from '@vue-flow/core';

function calculateControlOffset(distance: number, curvature: number) {
    if (distance >= 0) {
        return 0.5 * distance + curvature * 60;
    } else {
        return curvature * 25 * Math.sqrt(-distance);
    }
}

interface GetControlWithCurvatureParams {
    pos: Position;
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    c: number;
}

function getControlWithCurvature({
    pos,
    x1,
    y1,
    x2,
    y2,
    c,
}: GetControlWithCurvatureParams): [number, number] {
    let ctX: number, ctY: number;
    switch (pos) {
        case Position.Left:
            ctX = x1 - calculateControlOffset(x1 - x2, c);
            ctY = y1;
            break;
        case Position.Right:
            ctX = x1 + calculateControlOffset(x2 - x1, c);
            ctY = y1;
            break;
        case Position.Top:
            ctX = x1;
            ctY = y1 - calculateControlOffset(y1 - y2, c);
            break;
        case Position.Bottom:
            ctX = x1;
            ctY = y1 + calculateControlOffset(y2 - y1, c);
            break;
    }
    return [ctX, ctY];
}

interface GetBezierPathParams {
    sourceX: number;
    sourceY: number;
    sourcePosition?: Position;
    targetX: number;
    targetY: number;
    targetPosition?: Position;
    curvature?: number;
}

export interface PaddingBezierPathResult {
    path: string;
    sourceControlPoint: XYPosition;
    targetControlPoint: XYPosition;
}

export const getPaddingBezierPath = (
    bezierPathParams: GetBezierPathParams,
    sourceControlPoint?: XYPosition,
    targetControlPoint?: XYPosition,
    sourcePadding: number = 8,
    targetPadding: number = 8,
): PaddingBezierPathResult | undefined => {
    const {
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
        curvature = 0.25,
    } = bezierPathParams;
    if (!sourcePosition || !targetPosition) {
        return;
    }

    // 新增：startX/startY 是 source 前的偏移点
    let startX = sourceX;
    let startY = sourceY;
    switch (sourcePosition) {
        case Position.Left:
            startX = sourceX - sourcePadding;
            break;
        case Position.Right:
            startX = sourceX + sourcePadding;
            break;
        case Position.Top:
            startY = sourceY - sourcePadding;
            break;
        case Position.Bottom:
            startY = sourceY + sourcePadding;
            break;
    }

    // 新增：endX/endY 是 target 后的偏移点
    let endX = targetX;
    let endY = targetY;
    switch (targetPosition) {
        case Position.Left:
            endX = targetX - targetPadding;
            break;
        case Position.Right:
            endX = targetX + targetPadding;
            break;
        case Position.Top:
            endY = targetY - targetPadding;
            break;
        case Position.Bottom:
            endY = targetY + targetPadding;
            break;
    }

    if (!sourceControlPoint) {
        const [x, y] = getControlWithCurvature({
            pos: sourcePosition,
            x1: startX,
            y1: startY,
            x2: endX,
            y2: endY,
            c: curvature,
        });

        sourceControlPoint = {x, y};
    }

    if (!targetControlPoint) {
        const [x, y] = getControlWithCurvature({
            pos: targetPosition,
            x1: endX,
            y1: endY,
            x2: startX,
            y2: startY,
            c: curvature,
        });

        targetControlPoint = {x, y};
    }

    const path = `
        M${sourceX},${sourceY}
        C${sourceControlPoint.x},${sourceControlPoint.y} ${targetControlPoint.x},${targetControlPoint.y} ${targetX},${targetY}`;

    return {
        path,
        sourceControlPoint,
        targetControlPoint,
    };
};
