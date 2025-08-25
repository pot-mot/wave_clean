<script setup lang="ts">
import {MIND_MAP_CONTAINER_ID, useMindMap} from "@/mindMap/useMindMap.ts";
import {computed, onBeforeUnmount, onMounted, ref, watch} from "vue";
import LayerMenu from "@/mindMap/layer/LayerMenu.vue";
import MetaMenu from "@/mindMap/meta/MetaMenu.vue";
import IconSave from "@/components/icons/IconSave.vue";
import IconCopy from "@/components/icons/IconCopy.vue";
import IconCut from "@/components/icons/IconCut.vue";
import IconPaste from "@/components/icons/IconPaste.vue";
import IconFit from "@/components/icons/IconFit.vue";
import IconUndo from "@/components/icons/IconUndo.vue";
import IconRedo from "@/components/icons/IconRedo.vue";
import IconMenu from "@/components/icons/IconMenu.vue";
import IconSelectRect from "@/components/icons/IconSelectRect.vue";
import IconLayer from "@/components/icons/IconLayer.vue";
import IconDelete from "@/components/icons/IconDelete.vue";
import IconMultiSelect from "@/components/icons/IconMultiSelect.vue";
import IconSelectAll from "@/components/icons/IconSelectAll.vue";
import DownloadSelect from "@/mindMap/file/DownloadSelect.vue";
import {
    checkElementParent,
    checkIsInputOrTextarea,
    getMatchedElementOrParent
} from "@/utils/event/judgeEventTarget.ts";
import {useFocusTargetStore} from "@/store/focusTargetStore.ts";
import QuickInputBar from "@/mindMap/quickInput/QuickInputBar.vue";
import {checkIsMarkdownEditorElement} from "@/components/markdown/editor/MarkdownEditorElement.ts";
import IconDotsVertical from "@/components/icons/IconDotsVertical.vue";

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
    isSelectionPlural,
    canMultiSelect,
    toggleMultiSelect,

    toggleSelectAll,
    removeSelection,

    copy,
    cut,
    paste,
} = useMindMap()

const metaMenuOpen = ref(false)

const layersMenuOpen = ref(false)

const clipboardMenuOpen = ref(false)

const toggleClipboardMenuShow = () => {
    clipboardMenuOpen.value = !clipboardMenuOpen.value
}

/**
 * 监听返回键行为，拦截返回键并关闭当前菜单
 */
const handleBackState = (): boolean => {
    if (metaMenuOpen.value) {
        metaMenuOpen.value = false
        return false
    } else if (layersMenuOpen.value) {
        layersMenuOpen.value = false
        return false
    }
    return true
}

onMounted(() => {
    // @ts-ignore
    window.touchBackCallback = handleBackState
})

onBeforeUnmount(() => {
    // @ts-ignore
    window.touchBackCallback = null
})

/**
 * 检查聚焦元素
 */
const focusTargetStore = useFocusTargetStore()

const isMindMapNodeOrEdgeFocused = computed(() => {
    if (!currentLayer.value.vueFlow.vueFlowRef.value) {
        return false
    }
    const currentLayerElement = currentLayer.value.vueFlow.vueFlowRef.value

    const focusTarget = focusTargetStore.focusTarget.value
    if (!(focusTarget instanceof Element)) {
        return false
    }

    const nodeOrEdgeParent = getMatchedElementOrParent(focusTarget, (el) =>
        el.classList.contains("content-edge") || el.classList.contains("content-edge")
    )

    return nodeOrEdgeParent !== null && checkElementParent(nodeOrEdgeParent, currentLayerElement)
})

const isMindMapInputFocused = computed<boolean>(() => {
    if (!currentLayer.value.vueFlow.vueFlowRef.value) {
        return false
    }
    const currentLayerElement = currentLayer.value.vueFlow.vueFlowRef.value

    const focusTarget = focusTargetStore.focusTarget.value
    if (!(focusTarget instanceof Element)) {
        return false
    }

    // 判断是否是基础输入类型
    const isInputType = checkIsInputOrTextarea(focusTarget)
    // 判断是否是Markdown编辑器
    const isMarkdownEditor = checkIsMarkdownEditorElement(focusTarget)

    if (isInputType || isMarkdownEditor) {
        // 是否在思维导图容器内
        const inLayer = checkElementParent(focusTarget, currentLayerElement)

        if (inLayer) {
            return true
        }
    }

    if (isInputType) {
        // 是否有Markdown编辑器父级
        const markdownParent = getMatchedElementOrParent(focusTarget, (el) => checkIsMarkdownEditorElement(el))
        if (markdownParent === null) {
            return false
        }

        // Markdown编辑器父级是否在思维导图容器内
        const parentInLayer = checkElementParent(markdownParent, currentLayerElement)
        if (parentInLayer) {
            return true
        }

        // Markdown编辑器父级是否在思维导图容器内
        const parentInMindMapContainer = getMatchedElementOrParent(focusTarget, el => el.id === MIND_MAP_CONTAINER_ID) !== null
        if (parentInMindMapContainer) {
            return true
        }
    }

    return false
})

watch(
    () => {
        return isMindMapNodeOrEdgeFocused.value ||
            isMindMapInputFocused.value ||
            metaMenuOpen.value ||
            layersMenuOpen.value
    },
    (otherOpenValue) => {
        if (otherOpenValue) {
            clipboardMenuOpen.value = false
        }
    }
)
</script>

<template>
    <div class="toolbar top" :class="{open: !metaMenuOpen}">
        <div class="container">
            <button @click="metaMenuOpen = !metaMenuOpen" :class="{enable: metaMenuOpen}" style="padding-left: 1rem;">
                <IconMenu/>
            </button>
            <button @click="save()">
                <IconSave/>
            </button>

            <DownloadSelect style="margin-left: 0.5rem;"/>
        </div>

        <div class="container">
            <button @click="fitView()">
                <IconFit/>
            </button>

            <button @click="toggleClipboardMenuShow" :class="{enable: clipboardMenuOpen}" style="padding-right: 1rem;">
                <IconDotsVertical/>
            </button>
        </div>
    </div>

    <div
        class="toolbar right-top"
        :class="{
            open: clipboardMenuOpen
        }"
    >
        <div class="container">
            <button @click="copy()">
                <IconCopy/>
            </button>
            <button @click="cut()">
                <IconCut/>
            </button>
            <button @click="paste()">
                <IconPaste/>
            </button>

            <button @click="removeSelection()" v-if="isSelectionPlural">
                <IconDelete color="var(--danger-color)"/>
            </button>
        </div>
    </div>

    <div
        class="toolbar bottom"
        :class="{
            open: !isMindMapInputFocused && !metaMenuOpen
        }"
    >
        <div class="container">
            <button @click="toggleSelectAll()" style="padding-left: 1rem;">
                <IconSelectAll/>
            </button>

            <button @click="toggleMultiSelect()"
                    :class="{enable: canMultiSelect && defaultMouseAction !== 'selectionRect'}">
                <IconMultiSelect/>
            </button>

            <button @click="toggleDefaultMouseAction()" :class="{enable: defaultMouseAction === 'selectionRect'}">
                <IconSelectRect/>
            </button>
        </div>

        <div class="container">
            <button :disabled="!canUndo" @click="undo()" :class="{disabled: !canUndo}">
                <IconUndo/>
            </button>
            <button :disabled="!canRedo" @click="redo()" :class="{disabled: !canRedo}">
                <IconRedo/>
            </button>

            <button @click="layersMenuOpen = !layersMenuOpen" :class="{enable: layersMenuOpen}"
                    style="padding-right: 1rem; margin-left: 0.5rem;">
                <IconLayer/>
            </button>
        </div>
    </div>

    <div
        class="toolbar quick-input"
        :class="{
            open: isMindMapInputFocused && !metaMenuOpen
        }"
    >
        <QuickInputBar/>
    </div>

    <div
        class="toolbar meta-menu"
        :class="{open: !isMindMapInputFocused && metaMenuOpen}"
        @click.self="metaMenuOpen = false"
    >
        <div class="container">
            <MetaMenu/>
        </div>
    </div>

    <div
        class="toolbar layer-menu"
        :class="{open: !isMindMapInputFocused && layersMenuOpen}"
        @click.self="layersMenuOpen = false"
    >
        <div class="container">
            <LayerMenu/>
        </div>
    </div>
</template>

<style scoped>
.toolbar {
    z-index: var(--toolbar-z-index);
    position: absolute;
    background-color: var(--background-color);
    overflow-x: auto;
}

.toolbar button {
    height: 100%;
    padding: 0 0.6rem;
    background-color: var(--background-color);
    border: none;
    cursor: pointer;
    transition: background-color 0.3s ease;
}

.toolbar button:hover {
    background-color: var(--background-color-hover);
}

.toolbar button.disabled {
    color: var(--background-color-hover);
    --icon-color: var(--background-color-hover);
    background-color: var(--background-color);
    pointer-events: none;
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
    height: 2.5rem;
    line-height: 2.5rem;
    --icon-size: 1.25rem;
    display: flex;
    justify-content: space-between;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.5s ease;
}

.toolbar.top.open,
.toolbar.bottom.open {
    opacity: 1;
    pointer-events: all;
}

.toolbar.top {
    top: 0;
    border-bottom: var(--border);
    border-color: var(--background-color-hover);
}

.toolbar.bottom {
    top: var(--visual-height);
    transform: translateY(-100%);
    border-top: var(--border);
    border-color: var(--background-color-hover);
}

.toolbar.top > .container,
.toolbar.bottom > .container {
    display: flex;
}

.toolbar.right-top {
    height: fit-content;
    width: 2.5rem;
    top: 3rem;
    right: 0.5rem;
    border: var(--border);
    border-color: var(--background-color-hover);
    border-radius: var(--border-radius);
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.5s ease;
}

.toolbar.right-top.open {
    opacity: 1;
    pointer-events: all;
}

.toolbar.right-top > .container {
    display: flex;
    flex-direction: column;
}

.toolbar.right-top button {
    width: 100%;
    height: 2.5rem;
}

.toolbar.quick-input {
    width: 100%;
    padding-right: 0.5rem;
    line-height: 2.5rem;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.5s ease;

    z-index: var(--quick-input-toolbar-z-index);

    top: var(--visual-height);
    transform: translateY(-100%);
    border-top: var(--border);
    border-color: var(--background-color-hover);

    overflow-x: hidden;
}

.toolbar.quick-input.open {
    opacity: 1;
    pointer-events: all;
}

.toolbar.meta-menu,
.toolbar.layer-menu {
    width: 100vw;
    overflow: hidden;
    background-color: var(--mask-color);
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.5s ease;
}

.toolbar.meta-menu.open,
.toolbar.layer-menu.open {
    pointer-events: all;
    opacity: 1;
}

.toolbar.meta-menu > .container,
.toolbar.layer-menu > .container {
    transition: transform 0.5s ease;
}

.toolbar.meta-menu {
    top: 0;
    height: calc(100 * var(--vh));
    left: 0;
}

.toolbar.meta-menu > .container {
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    width: min(80vw, 20rem);
    border-right: var(--border);
    border-color: var(--background-color-hover);
    transform: translateX(-100%);
}

.toolbar.meta-menu.open > .container {
    transform: translateX(0);
}

.toolbar.layer-menu {
    top: 0;
    height: calc(100 * var(--vh) - 2.5rem);
    right: 0;
}

.toolbar.layer-menu > .container {
    position: absolute;
    top: 2.5rem;
    right: 0;
    height: calc(100% - 2.5rem);
    width: min(60vw, 20rem);
    border-left: var(--border);
    border-color: var(--background-color-hover);
    transform: translateX(100%);
}

.toolbar.layer-menu.open > .container {
    transform: translateX(0);
}
</style>
