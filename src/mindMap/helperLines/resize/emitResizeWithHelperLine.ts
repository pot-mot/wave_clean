import type {GraphNode} from '@vue-flow/core';
import type {OnResize} from '@vue-flow/node-resizer';

export type NodeResizeOrigin = {
    x: number;
    y: number;
    width: number;
    height: number;
};

export type ResizeWithHelperLineCallback = (
    node: GraphNode,
    resizeOrigin: NodeResizeOrigin,
    args: OnResize,
) => void;

const resizeHelperLineCallbackSet = new Set<ResizeWithHelperLineCallback>();

export const onResizeWithHelperLine = (callback: ResizeWithHelperLineCallback) => {
    resizeHelperLineCallbackSet.add(callback);
};
export const offResizeWithHelperLine = (callback: ResizeWithHelperLineCallback) => {
    resizeHelperLineCallbackSet.delete(callback);
};

export const emitResizeWithHelperLine = (
    node: GraphNode,
    resizeOrigin: NodeResizeOrigin,
    args: OnResize,
) => {
    for (const callback of resizeHelperLineCallbackSet) {
        callback(node, resizeOrigin, args);
    }
};
