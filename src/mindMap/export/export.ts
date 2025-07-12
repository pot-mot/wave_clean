import {VueFlowStore} from "@vue-flow/core";
import {
    ContentEdge,
    ContentNode,
    MindMapData,
    MindMapLayer
} from "@/mindMap/useMindMap.ts";
import {getRaw} from "@/utils/json/getRaw.ts";
import {v7 as uuid} from "uuid";
import {blurActiveElement} from "@/utils/event/judgeEventTarget.ts";
import {nextTick} from "vue";
import {sendMessage} from "@/components/message/sendMessage.ts";
import {exportAsJpg, exportAsPng, exportAsSvg} from "@/utils/file/htmlExport.ts";
import {
    validateContentEdge,
    validateContentNode,
    validateSizePositionEdgePartial
} from "@/mindMap/typeValidate/validateMindMap.ts";
import {downloadTextFile} from "@/utils/file/fileSave.ts";
import {jsonPrettyFormat} from "@/utils/json/jsonStringify.ts";

export type MindMapExportData = {
    nodes: ContentNode[],
    edges: ContentEdge[],
}

const toPureContentNode = (node: ContentNode): ContentNode => {
    return {
        id: node.id,
        type: "CONTENT_NODE",
        position: node.position,
        dimensions: node.dimensions,
        data: {
            content: node.data.content,
            type: node.data.type,
            color: node.data.color,
            withBorder: node.data.withBorder,
        },
    }
}

const toPureContentEdge = (edge: ContentEdge): ContentEdge => {
    return {
        id: edge.id,
        type: "CONTENT_EDGE",
        source: edge.source,
        sourceHandle: edge.sourceHandle,
        target: edge.target,
        targetHandle: edge.targetHandle,
        data: {
            content: edge.data.content,
            arrowType: edge.data.arrowType,
            color: edge.data.color,
            withBorder: edge.data.withBorder,
        }
    }
}

export const exportMindMapData = (vueFlow: VueFlowStore): MindMapExportData => {
    return {
        nodes: getRaw(vueFlow.getNodes.value.filter(it => validateContentNode(it)).map(toPureContentNode)),
        edges: getRaw(vueFlow.getEdges.value.filter(it => validateContentEdge(it)).map(it => toPureContentEdge(it as ContentEdge)))
    }
}

export const exportMindMapSelectionData = (vueFlow: VueFlowStore): MindMapExportData => {
    return {
        nodes: getRaw(vueFlow.getSelectedNodes.value.filter(it => validateContentNode(it)).map(toPureContentNode)),
        edges: getRaw(vueFlow.getSelectedEdges.value.filter(it => validateContentEdge(it)).map(it => toPureContentEdge(it as ContentEdge)))
    }
}

const ExportImageType_CONSTANTS = ["SVG", "PNG", "JPG"]

type ExportImageType = typeof ExportImageType_CONSTANTS[number]

const exportImageAs = async (el: HTMLElement, defaultSaveName: string, type: ExportImageType) => {
    switch (type) {
        case "PNG":
            return await exportAsPng(el, defaultSaveName)
        case "SVG":
            return await exportAsSvg(el, defaultSaveName)
        case "JPG":
            return await exportAsJpg(el, defaultSaveName)
    }
}

const getCombinedBounds = (vueFlow: VueFlowStore) => {
    const nodes = vueFlow.getNodes.value
    const edges = vueFlow.getEdges.value

    if (nodes.length === 0 && edges.length === 0) return;

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const node of nodes) {
        const {x, y} = node.position;
        const width = node.dimensions.width;
        const height = node.dimensions.height;

        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x + width);
        maxY = Math.max(maxY, y + height);
    }

    for (const edge of edges) {
        if (validateSizePositionEdgePartial(edge)) {
            if (edge.data.position !== undefined && edge.data.size !== undefined) {
                const left = edge.data.position.left
                const top = edge.data.position.top

                const width = edge.data.size.width
                const height = edge.data.size.height

                minX = Math.min(minX, left);
                minY = Math.min(minY, top);
                maxX = Math.max(maxX, left + width);
                maxY = Math.max(maxY, top + height);
            }
        }
    }

    return {
        left: minX,
        top: minY,
        right: maxX,
        bottom: maxY,
    }
}

const exportMindMapToImage = async (
    defaultFileName: string,
    layers: ReadonlyArray<MindMapLayer>,
    type: ExportImageType,
    options: {
        padding: number
    } = {
        padding: 32
    }
) => {
    const {padding} = options

    const id = `export-container-${uuid()}`

    const removeTransitionStyle = document.createElement('style')
    removeTransitionStyle.textContent = `
* {
    transition: none !important;
    -webkit-transition: none !important;
    -moz-transition: none !important;
    -o-transition: none !important;
}

#${id} {
    background-color: var(--background-color);
    z-index: -100;
}

#${id} input,
#${id} textarea,
#${id} .markdown-preview {
    pointer-events: all !important;
    cursor: text !important;
    user-select: text !important;
}

#${id} .markdown-preview .code-language {
    right: 0.25em;
}

#${id} .markdown-preview .code-copy-button {
    display: none;
}

#${id} *::-webkit-scrollbar {
    width: 0;
    height: 0;
}
`
    document.head.appendChild(removeTransitionStyle)
    let el: HTMLElement | null = null

    try {
        for (const layer of layers) {
            layer.vueFlow.removeSelectedNodes(layer.vueFlow.getSelectedNodes.value)
            layer.vueFlow.removeSelectedEdges(layer.vueFlow.getSelectedEdges.value)
        }
        blurActiveElement()

        await nextTick()

        el = document.createElement('div')
        el.id = id
        el.style.position = 'absolute'
        el.style.left = "0"
        el.style.top = "0"

        let left = Infinity
        let top = Infinity
        let right = -Infinity
        let bottom = -Infinity

        const nodeEdgeEls: HTMLElement[] = []

        for (const layer of layers) {
            if (layer.visible && layer.vueFlow.vueFlowRef.value) {
                for (const edgeContainer of layer.vueFlow.vueFlowRef.value.querySelectorAll('.vue-flow__edges')) {
                    const clone = edgeContainer.cloneNode(true) as HTMLElement
                    nodeEdgeEls.push(clone)
                }
                for (const nodeContainer of layer.vueFlow.vueFlowRef.value.querySelectorAll('.vue-flow__nodes')) {
                    const clone = nodeContainer.cloneNode(true) as HTMLElement
                    nodeEdgeEls.push(clone)
                }
                const rect = getCombinedBounds(layer.vueFlow)
                if (rect) {
                    left = Math.min(left, rect.left)
                    top = Math.min(top, rect.top)
                    right = Math.max(right, rect.right)
                    bottom = Math.max(bottom, rect.bottom)
                }
            }
        }

        if (left === Infinity || top === Infinity || right === -Infinity || bottom === -Infinity) {
            sendMessage("cannot export empty", {type: "warning"})
            return;
        }

        const width = Math.max(right - left + padding * 2, 1)
        const height = Math.max(bottom - top + padding * 2, 1)

        el.style.width = `${width}px`
        el.style.height = `${height}px`
        el.style.overflow = 'hidden'

        for (const nodeEdgeEl of nodeEdgeEls) {
            nodeEdgeEl.style.position = 'absolute'
            nodeEdgeEl.style.left = `${-left + padding}px`
            nodeEdgeEl.style.top = `${-top + padding}px`
            nodeEdgeEl.style.overflow = 'visible'
        }

        el.append(...nodeEdgeEls)

        document.body.appendChild(el)

        return await exportImageAs(el, defaultFileName, type)
    } catch (e) {
        console.error(e)
        throw e
    } finally {
        el?.remove()
        document.head.removeChild(removeTransitionStyle)
    }
}

const exportMindMapToJson = async (
    defaultFileName: string,
    mindMapData: MindMapData,
) => {
    return await downloadTextFile(jsonPrettyFormat(mindMapData), {filename: defaultFileName, fileType: "json"})
}

export const ExportFileType_CONSTANTS = [...ExportImageType_CONSTANTS, "JSON"]

export type ExportFileType = typeof ExportFileType_CONSTANTS[number]

export const exportMindMapToFile = async (
    currentMindMapName: string | null | undefined,
    mindMapData: MindMapData,
    layers: ReadonlyArray<MindMapLayer>,
    type: ExportFileType,
) => {
    const defaultSaveName = `${currentMindMapName ?? 'untitled'}-${new Date().getTime()}`

    if (type === "JSON") {
        return await exportMindMapToJson(defaultSaveName, mindMapData)
    } else {
        return await exportMindMapToImage(defaultSaveName, layers, type)
    }
}
