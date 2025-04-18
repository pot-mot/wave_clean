import {GNode, GNodeEvents} from "@/graph/node/GNode.ts";
import {GEdge, GEdgeEvents} from "@/graph/edge/GEdge.ts";
import {Point} from "@/graph/baseType/Shape.ts";
import {GraphBaseEvents} from "@/graph/baseType/Events.ts";

export type WithPrefix<T, Prefix extends string> = {
    [K in keyof T as `${Prefix}:${K & string}`]: T[K] & { id: symbol };
};

export type GraphEvents =
    GraphBaseEvents
    &
    {
        readonly "scale:change": { scale: number, previousScale: number }
        readonly "translate:change": { translate: Point, previousTranslate: Point }
    }
    & WithPrefix<GNodeEvents<GNode<any>>, "node">
    &
    {
        readonly "node:create": GNode<any>
    }
    & WithPrefix<GEdgeEvents<GEdge<any, any, any>>, "edge">
    &
    {
        readonly "edge:create": GEdge<any, any, any>
    }
