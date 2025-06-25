export type CollapseProps = {
    openTrigger?: 'head' | 'caret' | undefined,
    triggerPosition?: 'left' | 'right' | undefined,
    transitionDuration?: number | undefined,
}

export const defaultCollapseProps: CollapseProps = {
    openTrigger: 'caret',
    triggerPosition: 'right',
    transitionDuration: 300,
}