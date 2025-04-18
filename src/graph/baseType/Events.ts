import {GraphDataItem, GraphElementItem} from "@/graph/baseType/GraphItem.ts";

const ItemEvents = [
    "mouseenter",
    "mouseleave",
    "mouseover",
    "mouseout",
    "mousemove",
    "mousedown",
    "mouseup",
    "click",
    "dblclick",
    "contextmenu",
    "wheel",
    "keydown",
    "keyup"
] as const

export type GraphBaseEvents = {
    readonly [key in (typeof ItemEvents)[number]]: {
        event: HTMLElementEventMap[key],
    }
}

export type ItemBaseEvents<ItemType extends GraphElementItem> = {
    readonly [key in (typeof ItemEvents)[number]]: {
        event: SVGElementEventMap[key],
        item: ItemType
    }
}

export type DataElementItemEvents<ItemType extends GraphElementItem & GraphDataItem<any>> =
    ItemBaseEvents<ItemType> & {
    readonly "delete": ItemType

    readonly "data:change": { data: ItemType["data"], previousData?: ItemType["data"] | undefined, item: ItemType }

    readonly "select": ItemType
    readonly "unselect": ItemType
}
