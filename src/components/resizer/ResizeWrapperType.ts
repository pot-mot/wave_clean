export type ResizeOrigin = {
    clientX: number,
    clientY: number,
    width: number,
    height: number,
}

export type ResizeDirection =
    'top'
    | 'left'
    | 'right'
    | 'bottom'
    | 'top-left'
    | 'top-right'
    | 'bottom-left'
    | 'bottom-right'

export type ResizeStartEventArgs = {
    origin: ResizeOrigin,
    direction: ResizeDirection
}

export type ResizeEventArgs = {
    origin: ResizeOrigin,
    direction: ResizeDirection,
    currentSize: { width: number, height: number },
    totalDiff: { x: number, y: number },
    currentDiff: { x: number, y: number }
}

export type ResizeStopEventArgs = {
    origin: ResizeOrigin,
    direction: ResizeDirection,
    currentSize: { width: number, height: number },
    diff: { x: number, y: number }
}
