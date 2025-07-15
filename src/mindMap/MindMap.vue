<script setup lang="ts">
import {useMindMap} from "@/mindMap/useMindMap.ts";
import MobileToolbar from "@/mindMap/toolbar/mobile/MobileToolbar.vue";
import DesktopToolbar from "@/mindMap/toolbar/desktop/DesktopToolbar.vue";
import MindMapLayer from "@/mindMap/layer/MindMapLayer.vue";
import {nextTick, ref, watch} from "vue";
import MindMapBackground from "@/mindMap/background/MindMapBackground.vue";
import {judgeTargetIsInteraction} from "@/utils/event/judgeEventTarget.ts";
import {useDeviceStore} from "@/store/deviceStore.ts";

const {isTouchDevice} = useDeviceStore()

const {
    layers,
    currentLayer,
    undo,
    redo,
    save,
    isSelectionNotEmpty,
    copy,
    cut,
    paste,
} = useMindMap()

const backgroundKey = ref(true)

watch(() => currentLayer.value, async () => {
    backgroundKey.value = false
    await nextTick()
    backgroundKey.value = true
})

const handleKeyDown = async (e: KeyboardEvent) => {
    if (e.ctrlKey) {
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
        } else if (e.key === 'y' || e.key === "Y") {
            if (judgeTargetIsInteraction(e)) return

            e.preventDefault()
            redo()
        } else if (e.key === "s" || e.key === "S") {
            e.preventDefault()
            await save()
        } else if (e.key === "c" || e.key === "C") {
            if (judgeTargetIsInteraction(e)) return
            if (!isSelectionNotEmpty.value) return

            e.preventDefault()
            await copy()
        } else if (e.key === "x" || e.key === "X") {
            if (judgeTargetIsInteraction(e)) return
            if (!isSelectionNotEmpty.value) return

            e.preventDefault()
            await cut()
        } else if (e.key === "v" || e.key === "V") {
            if (judgeTargetIsInteraction(e)) return

            e.preventDefault()
            await paste()
        }
    }
}
</script>

<template>
    <div
        tabindex="-1"
        @keydown="handleKeyDown"
        id="mind-map-wrapper"
        style="width: 100%; height: 100%; position: relative;"
    >
        <MindMapBackground :viewport="currentLayer.vueFlow.viewport.value"/>

        <MindMapLayer
            v-for="layer in layers"
            :key="layer.id"
            :layer="layer"
        />

        <template v-if="isTouchDevice">
            <MobileToolbar/>
        </template>
        <template v-else>
            <DesktopToolbar/>
        </template>
    </div>
</template>
