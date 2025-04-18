import type {Point} from "@/graph/baseType/Shape.ts";

export type Local = {
    scale: number
    translate: Point
}

export const localToPage = (localPoint: Point, local: Local): Point => {
    return {
        x: localPoint.x * local.scale + local.translate.x,
        y: localPoint.y * local.scale + local.translate.y,
    }
}

export const pageToLocal = (pagePoint: Point, local: Local): Point => {
    return {
        x: (pagePoint.x - local.translate.x) / local.scale,
        y: (pagePoint.y - local.translate.y) / local.scale,
    }
}
