<script setup lang="ts">
import {md} from "@/components/markdown/preview/markdownRender.ts";
import {nextTick, onBeforeUnmount, onMounted, ref, useTemplateRef, watch} from "vue";
import "@/components/markdown/preview/markdown-preview.css"
import "@/components/markdown/preview/codeStyle/code.css"
import {imagePreview} from "@/components/markdown/preview/plugins/MarkdownItImage.ts";
import {getMatchedElementOrParent} from "@/utils/event/judgeEventTarget.ts";
import {copyText} from "@/utils/clipBoard/useClipBoard.ts";
import {sendMessage} from "@/components/message/sendMessage.ts";
import {copyButtonFindCodeBlockPre} from "@/components/markdown/preview/plugins/MarkdownItPrismCode.ts";
import {useThemeStore} from "@/store/themeStore.ts";

const themeStore = useThemeStore()

const props = defineProps<{
    value: string
}>()

const elementRef = useTemplateRef<HTMLDivElement>("elementRef")

const renderResult = ref("")

const render = () => {
    renderResult.value = md.render(props.value)
}

onMounted(() => {
    render()
})

watch(() => themeStore.theme.value, async () => {
    await nextTick()
    render()
})

// 处理点击事件
const handleClick = (e: MouseEvent) => {
    const selection = window.getSelection()
    let isSelectionEmpty = true

    if (selection && selection.toString().length > 0) {
        isSelectionEmpty = false
    }

    if (e.target && e.target instanceof Element && elementRef.value) {
        const currentElement: Element = e.target

        if (currentElement.classList.contains("code-copy-button")) {
            const codeBlockPre = copyButtonFindCodeBlockPre(currentElement)
            if (codeBlockPre) {
                copyText(codeBlockPre.textContent || "")
                sendMessage("Copy success", {type: "success"})
                return
            } else {
                sendMessage("Copy fail, target not found", {type: "error"})
                return
            }
        }

        if (currentElement instanceof HTMLImageElement && !currentElement.classList.contains('error')) {
            imagePreview(currentElement, elementRef.value)
            return
        }

        const svgSvgElement = getMatchedElementOrParent(currentElement, el => el instanceof SVGSVGElement)
        if (svgSvgElement && isSelectionEmpty) {
            imagePreview(svgSvgElement, elementRef.value);
            return
        }
    }
}

// 计算内容是否溢出
const isOverflow = ref(false)

let resizeObserver: ResizeObserver | null = null

const checkOverflow = () => {
    const element = elementRef.value
    if (element) {
        isOverflow.value =
            element.scrollHeight > element.clientHeight ||
            element.scrollWidth > element.clientWidth
    }
}

onMounted(() => {
    const element = elementRef.value
    if (element) {
        resizeObserver = new ResizeObserver(checkOverflow)
        resizeObserver.observe(element)
    }
})

onBeforeUnmount(() => {
    if (resizeObserver) {
        resizeObserver.disconnect()
        resizeObserver = null
    }
})

defineExpose({
    elementRef,
    isOverflow
})
</script>

<template>
    <div
        tabindex="-1"
        class="markdown-preview"
        v-html="renderResult"
        ref="elementRef"
        @click="handleClick"
    />
</template>

<style scoped>
.markdown-preview {
    cursor: text;
    user-select: text;
    border: var(--border);
    border-radius: var(--border-radius);
    background-color: var(--background-color);
    padding: 8px;
    tab-size: 4;
    overflow: auto;
    transition: color 0.3s ease, background-color 0.3s ease, border-color 0.3s ease;
}
</style>