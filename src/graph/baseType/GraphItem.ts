import {Graph} from "@/graph/graph/Graph.ts";
import {isSymbol} from "@/type/typeGuard.ts";

export type GraphSubItem<T extends string> = {
    readonly graph: Graph
    readonly type: T
}

export type GraphIdItem = {
    readonly id: symbol

    readonly selected: boolean
    readonly select: () => void
    readonly unselect: () => void
}

export type GraphDataItem<T> = GraphIdItem & {
    data: T,
}

export type GraphElementItem<El extends SVGElement = SVGElement> = GraphIdItem & {
    readonly el: El,
}

export const toId = <T extends GraphIdItem>(arg: T | symbol): symbol => {
    return isSymbol(arg) ? arg : arg.id;
}
