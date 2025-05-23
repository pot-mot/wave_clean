<script setup lang="ts">
import {useMindMap} from "@/mindMap/useMindMap.ts";
import {computed, onBeforeUnmount, onMounted, ref, shallowRef} from "vue";
import LayerMenu from "@/mindMap/layer/LayerMenu.vue";
import {checkElementParent} from "@/mindMap/clickUtils.ts";
import MetaMenu from "@/mindMap/meta/MetaMenu.vue";
import IconSave from "@/icons/IconSave.vue";
import IconCopy from "@/icons/IconCopy.vue";
import IconCut from "@/icons/IconCut.vue";
import IconPaste from "@/icons/IconPaste.vue";
import IconFit from "@/icons/IconFit.vue";
import IconUndo from "@/icons/IconUndo.vue";
import IconRedo from "@/icons/IconRedo.vue";
import IconMenu from "@/icons/IconMenu.vue";
import IconSelection from "@/icons/IconSelection.vue";
import IconLayer from "@/icons/IconLayer.vue";
import IconDrag from "@/icons/IconDrag.vue";
import IconDelete from "@/icons/IconDelete.vue";
import IconMultiSelect from "@/icons/IconMultiSelect.vue";
import {QuickInputItem, useMindMapMetaStore} from "@/mindMap/meta/MindMapMetaStore.ts";

const metaStore = useMindMapMetaStore()

const {
    save,

    currentLayer,

    canUndo,
    canRedo,
    undo,
    redo,
    fitView,
    defaultMouseAction,
    toggleDefaultMouseAction,
    isMultiSelected,
    canMultiSelect,
    toggleMultiSelect,

    selectAll,
    removeSelection,

    copy,
    cut,
    paste,
} = useMindMap()

const metaMenuOpen = ref(false)

const layersMenuOpen = ref(false)

const focusTarget = shallowRef<EventTarget | Element | null>()
const setActiveElementByActiveElement = () => {
    focusTarget.value = document.activeElement
}
const setActiveElementByFocusIn = (e: Event) => {
    focusTarget.value = e.target
}
const cleanActiveElement = () => {
    focusTarget.value = null
}

const isVueFlowInputFocused = computed<boolean>(() => {
    return (focusTarget.value instanceof HTMLInputElement || focusTarget.value instanceof HTMLTextAreaElement) &&
        currentLayer.value.vueFlow.vueFlowRef.value !== null && checkElementParent(focusTarget.value, currentLayer.value.vueFlow.vueFlowRef.value)
})

onMounted(() => {
    document.addEventListener('focusin', setActiveElementByFocusIn)
    document.addEventListener('focusout', cleanActiveElement)
    window.addEventListener('resize', setActiveElementByActiveElement)
})
onBeforeUnmount(() => {
    document.removeEventListener('focusin', setActiveElementByFocusIn)
    document.removeEventListener('focusout', cleanActiveElement)
    window.removeEventListener('resize', setActiveElementByActiveElement)
    cleanActiveElement()
})

const handleQuickInput = (quickInput: QuickInputItem) => {
    if (focusTarget.value instanceof HTMLInputElement || focusTarget.value instanceof HTMLTextAreaElement) {
        const target = focusTarget.value as HTMLInputElement | HTMLTextAreaElement

        const start = target.selectionStart ?? target.value.length
        const end = target.selectionEnd ?? target.value.length

        target.setRangeText(quickInput.value, start, end, 'end')

        const inputEvent = new Event('input', { bubbles: true })
        target.dispatchEvent(inputEvent)

        const changeEvent = new Event('change')
        target.dispatchEvent(changeEvent)
    }
}
</script>

<template>
    <div class="toolbar top" v-show="!metaMenuOpen">
        <div>
            <button @click="metaMenuOpen = !metaMenuOpen" :class="{enable: metaMenuOpen}">
                <IconMenu/>
            </button>
            <button @click="save()">
                <IconSave/>
            </button>
        </div>

        <div>
            <button @click="copy()">
                <IconCopy/>
            </button>
            <button @click="cut()">
                <IconCut/>
            </button>
            <button @click="paste()">
                <IconPaste/>
            </button>
        </div>

        <div>
            <button @click="selectAll()">
                <IconSelection/>
            </button>

            <button @click="removeSelection()" :class="{disabled: !isMultiSelected}">
                <IconDelete color="var(--icon-color)"/>
            </button>
        </div>
    </div>

    <div
        class="toolbar bottom"
        v-show="!isVueFlowInputFocused && !metaMenuOpen"
    >
        <div>
            <button @click="toggleDefaultMouseAction()">
                <IconDrag v-if="defaultMouseAction === 'panDrag'"/>
                <IconSelection v-else-if="defaultMouseAction === 'selectionRect'"/>
            </button>
            <button @click="fitView()">
                <IconFit/>
            </button>
            <button @click="toggleMultiSelect()" :class="{enable: canMultiSelect}">
                <IconMultiSelect/>
            </button>
        </div>

        <div>
            <button :disabled="!canUndo" @click="undo()" :class="{disabled: !canUndo}">
                <IconUndo/>
            </button>
            <button :disabled="!canRedo" @click="redo()" :class="{disabled: !canRedo}">
                <IconRedo/>
            </button>
        </div>

        <div>
            <button @click="layersMenuOpen = !layersMenuOpen" :class="{enable: layersMenuOpen}">
                <IconLayer/>
            </button>
        </div>
    </div>

    <div
        class="toolbar bottom"
        style="gap: 0.5rem;"
        v-show="isVueFlowInputFocused && !metaMenuOpen"
    >
        <button
            v-for="quickInput in metaStore.meta.value.quickInputs"
            :key="quickInput.id"
            @touchend.prevent="handleQuickInput(quickInput)"
        >
            {{ quickInput.label }}
        </button>
    </div>

    <div
        class="toolbar meta-menu"
        :class="{open: !isVueFlowInputFocused && metaMenuOpen}"
        @click.self="metaMenuOpen = false"
    >
        <div>
            <MetaMenu/>
        </div>
    </div>

    <div
        class="toolbar layer-menu"
        :class="{open: !isVueFlowInputFocused && layersMenuOpen}"
        @click.self="layersMenuOpen = false"
    >
        <div>
            <LayerMenu/>
        </div>
    </div>
</template>

<style scoped>
.toolbar {
    z-index: 5;
    position: absolute;
    background-color: var(--background-color);
    overflow-x: auto;
}

.toolbar button {
    height: 100%;
    padding: 0 1rem;
    background-color: var(--background-color);
    border: none;
    cursor: pointer;
    transition: background-color 0.5s ease;
}

.toolbar button:hover {
    background-color: var(--background-color-hover);
}

.toolbar button.disabled {
    color: var(--background-color-hover);
    --icon-color: var(--background-color-hover);
    background-color: var(--background-color);
    cursor: not-allowed;
}

.toolbar button.enable {
    color: var(--background-color);
    --icon-color: var(--background-color);
    background-color: var(--primary-color);
}

.toolbar.top,
.toolbar.bottom {
    width: 100%;
    height: 2rem;
    line-height: 2rem;
    display: flex;
    justify-content: space-between;
}

.toolbar.top {
    top: 0;
    border-bottom: var(--border);
    border-color: var(--background-color-hover);
}

.toolbar.bottom {
    bottom: 0;
    border-top: var(--border);
    border-color: var(--background-color-hover);
}

.toolbar.top > div,
.toolbar.bottom > div {
    display: flex;
}

.toolbar.meta-menu,
.toolbar.layer-menu {
    width: 100vw;
    background-color: var(--mask-color);
    transition: opacity 0.5s ease;
    pointer-events: none;
}
.toolbar.meta-menu.open,
.toolbar.layer-menu.open {
    pointer-events: all;
}

.toolbar.meta-menu > div,
.toolbar.layer-menu > div {
    transition: transform 0.5s ease;
}

.toolbar.meta-menu {
    top: 0;
    height: 100vh;
    left: 0;
    opacity: 0;
}
.toolbar.meta-menu.open {
    opacity: 1;
}

.toolbar.meta-menu > div {
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    width: 20rem;
    border-right: var(--border);
    border-color: var(--background-color-hover);
    transform: translateX(-100%);
}
.toolbar.meta-menu.open > div {
    transform: translateX(0);
}

.toolbar.layer-menu {
    top: 0;
    height: calc(100vh - 2rem);
    right: 0;
    opacity: 0;
}
.toolbar.layer-menu.open {
    opacity: 1;
}

.toolbar.layer-menu > div {
    position: absolute;
    top: 2rem;
    right: 0;
    height: calc(100% - 2rem);
    width: min(60vw, 20rem);
    border-left: var(--border);
    border-color: var(--background-color-hover);
    transform: translateX(100%);
}
.toolbar.layer-menu.open > div {
    transform: translateX(0);
}
</style>
