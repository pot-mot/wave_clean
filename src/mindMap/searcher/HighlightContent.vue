<script setup lang="ts">
import {computed, type VNode} from 'vue';
import {h} from 'vue';

const props = withDefaults(
    defineProps<{
        showFirst?: number | undefined;
        content: string;
        viewRanges: [number, number][];
    }>(),
    {
        showFirst: 3,
    },
);

// 计算高亮后的内容片段
const highlightedFragments = computed<VNode[][]>(() => {
    if (!props.viewRanges || props.viewRanges.length === 0) {
        return [];
    }

    // 获取需要显示的匹配项（前showFirst个）
    const rangesToShow = props.viewRanges.slice(0, props.showFirst);

    // 为每个匹配项提取上下文并生成VNode数组
    return rangesToShow.map((range): VNode[] => {
        const [start, end] = range;
        const contextStart = Math.max(0, start - 20);
        const contextEnd = Math.min(props.content.length, end + 20);

        const beforeMatch = props.content.substring(contextStart, start);
        const match = props.content.substring(start, end);
        const afterMatch = props.content.substring(end, contextEnd);

        const children: VNode[] = [];

        // 添加前缀省略号
        if (contextStart > 0) {
            children.push(h('span', '...'));
        }

        // 添加匹配前的文本
        if (beforeMatch) {
            children.push(h('span', beforeMatch));
        }

        // 添加高亮的匹配文本
        children.push(h('span', {class: 'highlight'}, match));

        // 添加匹配后的文本
        if (afterMatch) {
            children.push(h('span', afterMatch));
        }

        // 添加后缀省略号
        if (contextEnd < props.content.length) {
            children.push(h('span', '...'));
        }

        return children;
    });
});
</script>

<template>
    <div class="result-content">
        <template v-for="fragment in highlightedFragments">
            <template v-for="child in fragment">
                <component :is="child" />
            </template>
        </template>
    </div>
</template>

<style scoped>
.result-content {
    overflow: hidden;
    word-wrap: break-word;
    white-space: pre-wrap;
}
</style>

<style>
.result-content .highlight {
    background-color: var(--warning-color);
    color: #000;
    padding: 0 2px;
    border-radius: 2px;
}
</style>
