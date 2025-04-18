import {
    GraphDataItem,
    GraphElementItem,
    GraphSubItem,
} from "@/graph/baseType/GraphItem.ts";
import {PositionElement, SizeElement} from "@/graph/baseType/Shape.ts";
import {GNode} from "@/graph/node/GNode.ts";
import {GEdge, GEdge_NoTarget, GEdgeConnectData} from "@/graph/edge/GEdge.ts";
import {Emitter} from "mitt";
import {DataElementItemEvents} from "@/graph/baseType/Events.ts";

const GRAPH_PORT_TYPE = "GRAPH_PORT_TYPE" as const

export type GPortEvents<PortType extends GPort<any>> =
    DataElementItemEvents<PortType> &
    {
        readonly "startConnect": {edge: GEdge_NoTarget<GEdge<any, PortType>>}
        readonly "connected": {edge: GEdge<any, GEdgeConnectData<any>, PortType>}
    }


export type GPort<T, NodeType = any> = GraphSubItem<typeof GRAPH_PORT_TYPE> &
    GraphElementItem &
    GraphDataItem<T> &
    PositionElement &
    SizeElement &
    {
        readonly node: GNode<NodeType>
    } &
    Pick<Emitter<GPortEvents<GPort<T, NodeType>>>, 'on' | 'off'>
