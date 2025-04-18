import {
    GraphDataItem,
    GraphElementItem,
    GraphSubItem,
} from "@/graph/baseType/GraphItem.ts";
import {GNode} from "@/graph/node/GNode.ts";
import {GPort} from "@/graph/port/GPort.ts";
import {Emitter} from "mitt";
import {DataElementItemEvents} from "@/graph/baseType/Events.ts";

const GRAPH_EDGE_TYPE = "GRAPH_EDGE_TYPE" as const

export type GEdgeConnectData<T> =
    GNode<T> |
    GPort<T>

export type GEdgeEvents<EdgeType extends GEdge<any, any, any>> =
    DataElementItemEvents<EdgeType> &
    {
        readonly "connected": { target: EdgeType["target"] }
    }

export type GEdge<
    T,
    Source extends GEdgeConnectData<any> = GEdgeConnectData<any>,
    Target extends GEdgeConnectData<any> = GEdgeConnectData<any>
> =
    GraphSubItem<typeof GRAPH_EDGE_TYPE> &
    GraphElementItem &
    GraphDataItem<T> &
    {
        readonly source: Source
        readonly target: Target
    } &
    Pick<Emitter<GEdgeEvents<GEdge<T, Source, Target>>>, 'on' | 'off'>

export type GEdge_NoTarget<
    T,
    Source extends GEdgeConnectData<any> = GEdgeConnectData<any>,
    Target extends GEdgeConnectData<any> = GEdgeConnectData<any>
> =
    Omit<GEdge<T, Source, Target>, "target">
