<script setup lang="ts">
import {MIND_MAP_CONTAINER_ID, useMindMap} from "@/mindMap/useMindMap.ts";
import MobileToolbar from "@/mindMap/toolbar/mobile/MobileToolbar.vue";
import DesktopToolbar from "@/mindMap/toolbar/desktop/DesktopToolbar.vue";
import MindMapLayer from "@/mindMap/layer/MindMapLayer.vue";
import MindMapBackground from "@/mindMap/background/MindMapBackground.vue";
import {judgeTargetIsInteraction} from "@/utils/event/judgeEventTarget.ts";
import {useDeviceStore} from "@/store/deviceStore.ts";
import MindMapSelectionRect from "@/mindMap/selectionRect/MindMapSelectionRect.vue";

const {isTouchDevice} = useDeviceStore()

const {
    layers,
    currentLayer,
    focus,
    undo,
    redo,
    save,
    remove,
    selectionRect,
    graphSelection,
    enableMultiSelect,
    disableMultiSelect,
    toggleDefaultMouseAction,
    copy,
    cut,
    paste,
} = useMindMap()


const handleKeyDown = async (e: KeyboardEvent) => {
    // 按下 Delete 键删除选中的节点和边
    if (e.key === "Delete" || e.key === "Backspace") {
        if (judgeTargetIsInteraction(e)) return

        e.preventDefault()
        remove({nodes: graphSelection.selectedNodes.value, edges: graphSelection.selectedEdges.value})
        focus()
    }

    // 按下 Ctrl 键进入多选模式，直到松开 Ctrl 键
    else if (e.key === "Control") {
        if (judgeTargetIsInteraction(e)) return

        enableMultiSelect()
        focus()
        document.documentElement.addEventListener('keyup', (e) => {
            if (e.key === "Control" || e.ctrlKey) {
                disableMultiSelect()
            }
        }, {once: true})
    }

    // 按下 Shift 键进入框选模式，直到松开 Shift 键
    else if (e.key === "Shift") {
        if (judgeTargetIsInteraction(e)) return

        toggleDefaultMouseAction()
        focus()
        document.documentElement.addEventListener('keyup', (e) => {
            if (e.key === "Shift" || e.shiftKey) {
                toggleDefaultMouseAction()
            }
        }, {once: true})
    } else if (e.ctrlKey || e.metaKey) {
        // 按下 Ctrl + z 键，进行历史记录的撤回重做
        if ((e.key === "z" || e.key === "Z")) {
            if (judgeTargetIsInteraction(e)) return

            if (e.shiftKey) {
                e.preventDefault()
                redo()
            } else {
                e.preventDefault()
                undo()
            }
            focus()
        } else if (e.key === 'y' || e.key === "Y") {
            if (judgeTargetIsInteraction(e)) return

            e.preventDefault()
            redo()
            focus()
        }

        // 按下 Ctrl + s 键，保存模型
        else if (e.key === "s" || e.key === "S") {
            e.preventDefault()
            await save()
            focus()
        }

        // 剪切板快捷键
        else if (e.key === "c" || e.key === "C") {
            if (judgeTargetIsInteraction(e)) return
            if (graphSelection.selectedCount.value < 1) return

            e.preventDefault()
            await copy()
            focus()
        } else if (e.key === "x" || e.key === "X") {
            if (judgeTargetIsInteraction(e)) return
            if (graphSelection.selectedCount.value < 1) return

            e.preventDefault()
            await cut()
            focus()
        } else if (e.key === "v" || e.key === "V") {
            if (judgeTargetIsInteraction(e)) return

            e.preventDefault()
            await paste()
            focus()
        }

        // 全选
        else if (e.key === "a" || e.key === "A") {
            if (judgeTargetIsInteraction(e)) return

            e.preventDefault()

            graphSelection.selectAll()
            focus()
        }
    }
}
</script>

<template>
    <div
        tabindex="-1"
        @keydown="handleKeyDown"
        :id="MIND_MAP_CONTAINER_ID"
        style="width: 100%; height: 100%; position: relative;"
    >
        <MindMapBackground :viewport="currentLayer.vueFlow.viewport.value"/>

        <MindMapLayer
            v-for="(layer, index) in layers"
            :key="layer.id"
            :layer="layer"
            :index="index"
        />

        <MindMapSelectionRect :rect="selectionRect"/>

        <template v-if="isTouchDevice">
            <MobileToolbar/>
        </template>
        <template v-else>
            <DesktopToolbar/>
        </template>
    </div>
</template>
