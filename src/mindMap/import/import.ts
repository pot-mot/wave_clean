import {VueFlowStore, XYPosition} from "@vue-flow/core";
import {
    createEdgeId,
    createNodeId
} from "@/mindMap/useMindMap.ts";
import {toRaw} from "vue";
import {FullConnection, reverseConnection} from "@/mindMap/edge/connection.ts";
import {ContentNode, ContentNode_JsonSchema, ContentNodeHandles} from "@/mindMap/node/ContentNode.ts";
import {ContentEdge, ContentEdge_JsonSchema} from "@/mindMap/edge/ContentEdge.ts";
import type {JSONSchemaType} from "ajv/lib/types/json-schema.ts";
import {createSchemaValidator} from "@/utils/type/typeGuard.ts";

export type MindMapImportData = {
    nodes?: (ContentNode | undefined | null)[],
    edges?: (ContentEdge | undefined | null)[],
}

const MindMapImportData_JsonSchema: JSONSchemaType<MindMapImportData> = {
    type: "object",
    properties: {
        nodes: {type: "array", items: ContentNode_JsonSchema, nullable: true},
        edges: {type: "array", items: ContentEdge_JsonSchema, nullable: true},
    }
}

export const validateMindMapImportData = createSchemaValidator<MindMapImportData>(MindMapImportData_JsonSchema)

export type UnconnectedEdgeReason = {
    connectionExist: boolean,
    sourceNotExist: boolean,
    targetNotExist: boolean,
    sourceHandleNotExist: boolean,
    targetHandleNotExist: boolean
}

export type MindMapImportDataCleanResult = {
    nodeIdChangeMap: Map<string, string>
    edgeIdChangeMap: Map<string, string>
    newNodes: ContentNode[],
    newEdges: ContentEdge[],
    unconnectedEdges: Map<ContentEdge, UnconnectedEdgeReason>
}

/**
 * 将对导入数据进行清理，保证：
 *      data.nodes id 与当前 vueStore nodes id 以及自身的其他 id 不存在重复。若存在重复则生成新的 id。
 *          若出现 id 修改，返回 nodeIdChangeMap: Map<oldId, newId>。
 *      data.edges id 与当前 vueStore nodes id 以及自身的其他 id 不存在重复。若存在重复则根据新的关联重置 id。
 *          若出现 id 修改，返回 edgeIdChangeMap: Map<oldId, newId>。
 *      data.edges source target 保证一定为 vueStore 或 data 中的 nodes id。
 *          如果 source target 同时存在于 vueStore 和 data，优先采用 newId。
 *          若发生 data.nodes id 重复导致 id 重命名，则根据 nodeIdChangeMap 修改 source 和 target。
 *          若发生 source / sourceHandle / target / targetHandle 不存在在 vueStore 或 data 中，则将存放在 unconnectedEdges 中。
 */
export const clearImportData = (
    data: MindMapImportData,
    existedNodeIds: ReadonlySet<string>,
    existedEdgeIds: ReadonlySet<string>,
    nodeHandleIdsMap: ReadonlyMap<string, ReadonlySet<string>>,
): MindMapImportDataCleanResult => {
    const nodeIdChangeMap = new Map<string, string>()
    const edgeIdChangeMap = new Map<string, string>()
    const newNodes: ContentNode[] = []
    const newEdges: ContentEdge[] = []
    const unconnectedEdges = new Map<ContentEdge, UnconnectedEdgeReason>()

    const usedNodeIds = new Set(existedNodeIds)
    const nodes = data.nodes?.filter((node): node is ContentNode => !!node) ?? []

    // 处理节点ID冲突
    for (const node of nodes) {
        const {id, ...other} = node
        let newId = id

        while (usedNodeIds.has(newId)) {
            newId = createNodeId()
        }

        if (id !== newId) {
            nodeIdChangeMap.set(id, newId)
        }

        usedNodeIds.add(newId)
        newNodes.push({...other, id: newId})
    }

    // 构建临时handle映射（包含现有节点和新节点）
    const tempHandleMap = new Map<string, Set<string>>();
    for (const [id, handles] of nodeHandleIdsMap.entries()) {
        tempHandleMap.set(id, new Set(handles));
    }

    for (const node of newNodes) {
        tempHandleMap.set(node.id, new Set(ContentNodeHandles))
    }

    // 处理边ID冲突
    const usedEdgeIds = new Set(existedEdgeIds);
    const edges = data.edges?.filter((edge): edge is ContentEdge => !!edge) ?? []

    for (const edge of edges) {
        const {id, source, target, ...other} = edge

        let newSource = source
        let newTarget = target

        const matchedNewSourceId = nodeIdChangeMap.get(source)
        if (matchedNewSourceId !== undefined) {
            newSource = matchedNewSourceId
        }

        const matchedNewTargetId = nodeIdChangeMap.get(target)
        if (matchedNewTargetId !== undefined) {
            newTarget = matchedNewTargetId
        }

        // 检查source/target是否存在
        const sourceExists = tempHandleMap.has(newSource)
        const targetExists = tempHandleMap.has(newTarget)

        // 检查handle是否存在
        const sourceHandleExists = edge.sourceHandle !== null && edge.sourceHandle !== undefined && tempHandleMap.get(newSource)?.has(edge.sourceHandle)
        const targetHandleExists = edge.targetHandle !== null && edge.targetHandle !== undefined && tempHandleMap.get(newTarget)?.has(edge.targetHandle)

        // 如果有任一不存在，则不作为 newEdges
        if (!sourceExists || !targetExists || !sourceHandleExists || !targetHandleExists) {
            unconnectedEdges.set(edge, {
                connectionExist: false,
                sourceNotExist: !sourceExists,
                targetNotExist: !targetExists,
                sourceHandleNotExist: !sourceHandleExists,
                targetHandleNotExist: !targetHandleExists,
            })
        } else {
            const newConnection: FullConnection = {
                source: newSource,
                target: newTarget,
                sourceHandle: edge.sourceHandle,
                targetHandle: edge.targetHandle
            }
            const newId = createEdgeId(newConnection)
            if (usedEdgeIds.has(newId) || usedEdgeIds.has(createEdgeId(reverseConnection(newConnection)))) {
                unconnectedEdges.set(edge, {
                    connectionExist: true,
                    sourceNotExist: !sourceExists,
                    targetNotExist: !targetExists,
                    sourceHandleNotExist: !sourceHandleExists,
                    targetHandleNotExist: !targetHandleExists,
                })
            } else {
                usedEdgeIds.add(newId)
                edgeIdChangeMap.set(edge.id, newId)

                newEdges.push({...other, id: newId, source: newSource, target: newTarget})
            }
        }
    }

    return {
        nodeIdChangeMap,
        edgeIdChangeMap,
        newNodes,
        newEdges,
        unconnectedEdges,
    };
}

export type JustifyOptions = {
    point: XYPosition,
    type: "leftTop" | "topNode" | "leftNode"
}

/**
 * 将节点和边对齐到 leftTop
 */
const justifyNodes = (
    nodes: ContentNode[],
    options: JustifyOptions,
) => {
    if (nodes.length === 0) return

    let baseX: number
    let baseY: number

    switch (options.type) {
        case 'leftTop': {
            // 计算全局最小坐标
            baseX = Math.min(...nodes.map(n => n.position.x))
            baseY = Math.min(...nodes.map(n => n.position.y))
            break
        }
        case 'topNode': {
            // 查找Y值最小的节点
            const topNode = nodes.reduce((prev, curr) =>
                prev.position.y < curr.position.y ? prev : curr
            )
            baseX = topNode.position.x
            baseY = topNode.position.y
            break
        }
        case 'leftNode': {
            // 查找X值最小的节点
            const leftNode = nodes.reduce((prev, curr) =>
                prev.position.x < curr.position.x ? prev : curr
            )
            baseX = leftNode.position.x
            baseY = leftNode.position.y
            break
        }
    }

    // 统一应用偏移量
    const offsetX = options.point.x - baseX
    const offsetY = options.point.y - baseY

    for (const node of nodes) {
        node.position.x += offsetX;
        node.position.y += offsetY;
    }
}

/**
 * 向 vueFlow 导入 data
 * justifyOptions 为 undefined，则不重对齐 nodes 位置
 */
export const prepareImportIntoMindMap = (
    vueFlow: VueFlowStore,
    data: MindMapImportData,
    justifyOptions?: JustifyOptions | undefined,
): MindMapImportDataCleanResult => {
    const nodes = toRaw(vueFlow.getNodes.value)
    const edges = toRaw(vueFlow.getEdges.value)

    const existedNodeIds = new Set<string>(nodes.map(it => it.id))
    const existedEdgeIds = new Set<string>(edges.map(it => it.id))
    const nodeHandleIdsMap = new Map<string, Set<string>>()
    for (const node of nodes) {
        const handles = [...node.handleBounds.source ?? [], ...node.handleBounds.target ?? []]
        const handleIdSet = new Set<string>(handles.map(it => it.id).filter(it => it !== null && it !== undefined))
        nodeHandleIdsMap.set(node.id, handleIdSet)
    }

    const clearResult = clearImportData(
        data,
        existedNodeIds,
        existedEdgeIds,
        nodeHandleIdsMap
    )

    if (justifyOptions !== undefined) {
        justifyNodes(clearResult.newNodes, justifyOptions)
    }

    return clearResult
}
