import {ShallowReactive} from "vue";
import {VueFlowStore} from "@vue-flow/core";
import {CustomClipBoard} from "@/utils/clipBoard/useClipBoard.ts";
import {MindMapImportData} from "@/mindMap/import/import.ts";
import {MindMapExportData} from "@/mindMap/export/export.ts";

// 思维导图图层（字面量，非响应式）类型
// 包含：
//  图层本身的基本信息
//  剪切板API
export type RawMindMapLayer = {
    readonly id: string,
    readonly vueFlow: VueFlowStore,
    name: string,
    visible: boolean,
    opacity: number,
} & CustomClipBoard<MindMapImportData, MindMapExportData>

// 思维导图图层类型（响应式）
export type MindMapLayer = ShallowReactive<RawMindMapLayer>

// 思维导图图层数据，包含其中需要被历史记录跟踪的部分
export const MindMapLayerDataKeys = ['name', 'opacity'] as const
export type MindMapLayerData = Pick<RawMindMapLayer, typeof MindMapLayerDataKeys[number]>