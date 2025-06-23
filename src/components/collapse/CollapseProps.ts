export type CollapseProps = {
    openTrigger?: 'head' | 'caret' | undefined,
    triggerPosition?: 'left' | 'right' | undefined,
    transitionDuration?: number | undefined,
}

export const defaultCollapseProps: CollapseProps = {
    openTrigger: 'head',
    triggerPosition: 'left',
    transitionDuration: 300,
}