<script setup lang="ts">
import {md} from '@/components/markdown/preview/markdownRender.ts';
import {
    nextTick,
    onBeforeUnmount,
    onMounted,
    type Ref,
    ref,
    useTemplateRef,
    type VNode,
    watch,
} from 'vue';
import '@/components/markdown/preview/markdown-preview.css';
import '@/components/markdown/preview/plugins/code/style.css';
import {getMatchedElementOrParent} from '@/utils/event/judgeEventTarget.ts';
import {sendMessage} from '@/components/message/messageApi.ts';
import {useThemeStore} from '@/store/themeStore.ts';
import {translate} from '@/store/i18nStore.ts';
import {debounce} from 'lodash-es';
import {VNodeComponent} from '@/components/markdown/preview/render/VNodeComponent.ts';
import {previewImage} from '@/components/markdown/preview/plugins/image/previewImage.ts';

const themeStore = useThemeStore();

const props = defineProps<{
    value: string;
}>();

const elementRef = useTemplateRef<HTMLDivElement>('elementRef');

const renderResult: Ref<VNode[]> = ref([]);

// 计算内容是否溢出
const isOverflow = ref(false);

const checkOverflow = debounce(() => {
    const element = elementRef.value;
    if (element) {
        isOverflow.value =
            element.scrollHeight > element.clientHeight ||
            element.scrollWidth > element.clientWidth;
    }
}, 100);

const resizeObserver: ResizeObserver = new ResizeObserver(checkOverflow);
const mutationObserver = new MutationObserver(checkOverflow);

onBeforeUnmount(() => {
    resizeObserver.disconnect();
    mutationObserver.disconnect();
});

const render = () => {
    renderResult.value = md.render(props.value) as any;
};

onMounted(() => {
    if (!elementRef.value) {
        sendMessage(translate('markdown_element_not_exist'), {type: 'error'});
        return;
    }

    resizeObserver.observe(elementRef.value);
    // 监听内容变化：图片加载、子节点变化等
    mutationObserver.observe(elementRef.value, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['style', 'class'],
        characterData: false,
    });

    render();
});

watch(
    () => [props.value, themeStore.theme.value],
    async () => {
        await nextTick();
        render();
    },
);

// 处理点击事件
const handleClick = (e: MouseEvent) => {
    checkOverflow();

    const selection = window.getSelection();
    let isSelectionEmpty = true;

    if (selection && selection.toString().length > 0) {
        isSelectionEmpty = false;
    }

    if (e.target && e.target instanceof Element && elementRef.value) {
        const currentElement: Element = e.target;

        if (
            currentElement instanceof HTMLImageElement &&
            !currentElement.classList.contains('error')
        ) {
            previewImage(currentElement, elementRef.value);
            return;
        }

        const svgSvgElement = getMatchedElementOrParent(
            currentElement,
            (el) => el instanceof SVGSVGElement,
        );
        if (svgSvgElement && isSelectionEmpty) {
            previewImage(svgSvgElement, elementRef.value);
            return;
        }
    }
};

defineExpose({
    elementRef,
    isOverflow,
});
</script>

<template>
    <div
        tabindex="-1"
        class="markdown-preview"
        ref="elementRef"
        @click="handleClick"
    >
        <VNodeComponent :content="renderResult" />
    </div>
</template>

<style scoped>
.markdown-preview {
    cursor: text;
    user-select: text;
    tab-size: 4;
    overflow: auto;
    transition:
        color 0.3s ease,
        background-color 0.3s ease,
        border-color 0.3s ease;
}
</style>
