export type Point = {
    readonly x: number,
    readonly y: number,
}

export type RectSize = {
    readonly width: number,
    readonly height: number,
}

export type CircleSize = {
    readonly r: number,
}

export type PositionElement = {
    readonly position: Point,
    readonly setPosition: (position: Point) => void,
}

export type RectSizeElement = {
    readonly shapeType: 'rect',
    readonly size: RectSize,
    readonly setSize: (size: RectSize) => void,
}

export type CircleSizeElement = {
    readonly shapeType: 'circle',
    readonly size: CircleSize,
    readonly setSize: (size: CircleSize) => void,
}

export type SizeElement = RectSizeElement | CircleSizeElement
