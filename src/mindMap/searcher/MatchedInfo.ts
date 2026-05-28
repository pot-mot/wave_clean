import type {ContentNode} from '@/mindMap/node/ContentNode.ts';
import type {ContentEdge} from '@/mindMap/edge/ContentEdge.ts';

export type MatchedNodeInfo = {
    node: ContentNode;
    layerId: string;
    viewRanges: [number, number][];
};

export type MatchedEdgeInfo = {
    edge: ContentEdge;
    layerId: string;
    viewRanges: [number, number][];
};
