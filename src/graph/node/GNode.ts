import {
    GraphDataItem,
    GraphElementItem,
    GraphSubItem,
} from "@/graph/baseType/GraphItem.ts";
import {Point, PositionElement, RectSize, RectSizeElement} from "@/graph/baseType/Shape.ts";
import {GPort} from "@/graph/port/GPort.ts";
import {Emitter} from "mitt";
import {GEdge, GEdge_NoTarget, GEdgeConnectData} from "@/graph/edge/GEdge.ts";
import {DataElementItemEvents} from "@/graph/baseType/Events.ts";

const GRAPH_NODE_TYPE = "GRAPH_NODE_TYPE" as const

export type GNodeEvents<NodeType extends GNode<any>> =
    DataElementItemEvents<NodeType> &
    {
        readonly "resize": { size: RectSize, previousSize: RectSize },
        readonly "move": { position: Point, previousPosition: Point }

        readonly "parent:change": {
            parent: GPort<NodeType["parent"]>,
            previousParent?: GPort<NodeType["parent"]> | undefined
        }

        readonly "child:add": { port: GPort<NodeType["children"][number]> }
        readonly "child:remove": { port: GPort<NodeType["children"][number]> }
        readonly "child:change": {
            children: GPort<NodeType["children"][number]>[],
            previousChildren: GPort<NodeType["children"][number]>[]
        }

        readonly "port:add": { port: GPort<NodeType["ports"][number]> }
        readonly "port:remove": { port: GPort<NodeType["ports"][number]> }
        readonly "port:change": {
            ports: GPort<NodeType["ports"][number]>[],
            previousChildren: GPort<NodeType["ports"][number]>[]
        }

        readonly "startConnect": {edge: GEdge_NoTarget<GEdge<any, NodeType>>}
        readonly "connected": {edge: GEdge<any, GEdgeConnectData<any>, NodeType>}
    }

export type GNode<T, PARENT_TYPE = any, CHILD_TYPE = any, PORT_TYPE = any> =
    GraphSubItem<typeof GRAPH_NODE_TYPE> &
    GraphElementItem &
    GraphDataItem<T> &
    PositionElement &
    RectSizeElement &
    {
        readonly parent?: GNode<PARENT_TYPE> | undefined
        readonly children: GNode<CHILD_TYPE, T>[]
        readonly ports: GPort<PORT_TYPE, T>[]
    } &
    Pick<Emitter<GNodeEvents<GNode<T, PARENT_TYPE, CHILD_TYPE, PORT_TYPE>>>, 'on' | 'off'>
