export type BaseHistory = {
    canUndo(): boolean
    undo(): void

    canRedo(): boolean
    redo(): void
}
