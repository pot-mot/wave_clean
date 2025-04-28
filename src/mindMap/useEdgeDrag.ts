import {GraphEdge, GraphNode, HandleElement, VueFlowStore} from "@vue-flow/core";
import mitt from "mitt";
import {checkElementParent} from "@/mindMap/clickUtils.ts";

export type EdgeDragStartArgs = {
    event: MouseEvent | TouchEvent,
    edges: GraphEdge[],
}

export type EdgeDraggingArgs = EdgeDragStartArgs & {
    targetNode?: GraphNode | undefined,
    targetHandle?: HandleElement | undefined,
}

export type EdgeDragEvents = {
    dragStart: EdgeDragStartArgs,
    drag: EdgeDraggingArgs,
    dragStop: EdgeDraggingArgs,
}

export const useEdgeDrag = (vueFlow: VueFlowStore) => {
    const edgeDragEventBus = mitt<EdgeDragEvents>()
    const edgeDragEventHandlerMap = new Map<string, (event: MouseEvent) => void>

    document.documentElement.addEventListener("mousedown", (e) => {
        for (const handler of edgeDragEventHandlerMap.values()) {
            handler(e)
        }
    })

    const setEdgeDragEvent = (edge: GraphEdge) => {
        edgeDragEventHandlerMap.set(edge.id, (event: MouseEvent) => {
            if (!(event.target instanceof Element)) return

            const edgeEl: SVGGElement | null = document.documentElement.querySelector(`g[data-id="${edge.id}"]`)
            if (edgeEl === null) return

            if (event.target !== edgeEl && !checkElementParent(event.target, edgeEl)) return

            console.log("dragStart")
            edgeDragEventBus.emit("dragStart", {event, edges: [edge]})

            const onDrag = (event: MouseEvent) => {
                console.log("drag")
                edgeDragEventBus.emit("drag", {event, edges: [edge]})
            }

            const onDragStop = (event: MouseEvent) => {
                console.log("dragStop")

                document.documentElement.removeEventListener("mousemove", onDrag)
                document.documentElement.removeEventListener("mouseup", onDragStop)

                edgeDragEventBus.emit("dragStop", {event, edges: [edge]})
            }

            document.documentElement.addEventListener("mousemove", onDrag)
            document.documentElement.addEventListener("mouseup", onDragStop)
        })
    }

    vueFlow.onEdgesChange((changes) => {
        for (const change of changes) {
            if (change.type === "add") {
                setEdgeDragEvent(change.item)
            } else if (change.type === "remove") {
                edgeDragEventHandlerMap.delete(change.id)
            }
        }
    })

    const onEdgeDragStart = (handler: (params: EdgeDragStartArgs) => void) => {
        edgeDragEventBus.on("dragStart", handler)
    }

    const onEdgeDrag = (handler: (params: EdgeDraggingArgs) => void) => {
        edgeDragEventBus.on("drag", handler)
    }

    const onEdgeDragStop = (handler: (params: EdgeDraggingArgs) => void) => {
        edgeDragEventBus.on("dragStop", handler)
    }

    return {
        ...vueFlow,
        onEdgeDragStart,
        onEdgeDrag,
        onEdgeDragStop,
    }
}
