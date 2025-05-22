<script setup lang="ts">
import {useMindMap} from "@/mindMap/useMindMap.ts";
import MobileBar from "@/mindMap/toolBar/mobile/MobileBar.vue";
import DeskTopBar from "@/mindMap/toolBar/desktop/DeskTopBar.vue";
import MindMapLayer from "@/mindMap/layer/MindMapLayer.vue";
import {nextTick, ref, watch} from "vue";
import BackGround from "@/mindMap/background/BackGround.vue";
import {judgeTargetIsInteraction} from "@/mindMap/clickUtils.ts";

const {
    isTouchDevice,
    layers,
    currentLayer,
    undo,
    redo,
    save,
} = useMindMap()

const backgroundKey = ref(true)

watch(() => currentLayer.value, async () => {
    backgroundKey.value = false
    await nextTick()
    backgroundKey.value = true
})

const handleKeyDown = (e: KeyboardEvent) => {
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
        } else if (e.key === "s" || e.key === "S") {
            e.preventDefault()
            save()
        }
    }
}
</script>

<template>
    <div
        tabindex="-1"
        @keydown="handleKeyDown"
        style="width: 100%; height: 100%;"
        :style="{ backgroundColor: 'var(--background-color)' }"
    >
        <BackGround :viewport="currentLayer.vueFlow.viewport.value"/>

        <template v-for="layer in layers" :key="layer.id">
            <MindMapLayer :layer="layer"/>
        </template>

        <template v-if="isTouchDevice">
            <MobileBar/>
        </template>
        <template v-else>
            <DeskTopBar/>
        </template>
    </div>
</template>
