<script setup lang="ts">
import {useMindMap} from "@/mindMap/useMindMap.ts";
import {computed, onBeforeUnmount, onMounted, ref, shallowRef} from "vue";
import LayerMenu from "@/mindMap/layer/LayerMenu.vue";

const {
    canUndo,
    canRedo,
    undo,
    redo,
    fitView,
    defaultMouseAction,
    toggleDefaultMouseAction,
    canMultiSelect,
    toggleMultiSelect,

    selectAll,

    copy,
    cut,
    paste,
} = useMindMap()

const layersMenuOpen = ref(false)

const focusTarget = shallowRef<EventTarget | null>()
const setActiveElement = (e: Event) => {
    focusTarget.value = e.target
}
const cleanActiveElement = () => {
    focusTarget.value = null
}

const isInputFocused = computed(() => {
    return focusTarget.value instanceof HTMLInputElement || focusTarget.value instanceof HTMLTextAreaElement
})

onMounted(() => {
    document.addEventListener('focusin', setActiveElement)
    document.addEventListener('focusout', cleanActiveElement)
})
onBeforeUnmount(() => {
    document.removeEventListener('focusin', setActiveElement)
    document.removeEventListener('focusout', cleanActiveElement)
})
</script>

<template>
    <template v-show="!isInputFocused">
        <div style="z-index: 5; width: 100%; position: absolute; top: 0; left: 0; height: 2rem; line-height: 2rem; vertical-align: center; display: flex; justify-content: space-around;">
            <button @click="copy">copy</button>
            <button @click="cut">cut</button>
            <button @click="paste">paste</button>

            <button @click="selectAll()">selectAll</button>
        </div>

        <div style="z-index: 5; width: 100%; position: absolute; bottom: 0; height: 2rem; line-height: 2rem; vertical-align: center; display: flex; justify-content: space-around;">
            <button @click="fitView()">fit</button>
            <button @click="toggleDefaultMouseAction">{{ defaultMouseAction }}</button>
            <button @click="toggleMultiSelect">multiselect: {{ canMultiSelect }}</button>

            <button :disabled="!canUndo" @click="undo">undo</button>
            <button :disabled="!canRedo" @click="redo">redo</button>

            <button @click="layersMenuOpen = !layersMenuOpen">layers</button>
        </div>

        <div v-show="layersMenuOpen" style="z-index: 5; position: absolute; bottom: 3rem; right: 0; height: calc(100% - 3rem); width: min(60vw, 20rem);">
            <LayerMenu/>
        </div>
    </template>
</template>
