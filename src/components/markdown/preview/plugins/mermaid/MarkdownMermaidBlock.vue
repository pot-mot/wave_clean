<script setup lang="ts">
import {ref, watch} from 'vue';
import MarkdownCode from '../code/MarkdownCode.vue';
import {useThemeStore} from '@/store/themeStore.ts';
import {renderMermaid} from './render.ts';

const themeStore = useThemeStore();

const props = defineProps<{
    code: string;
}>();

const result = ref<string>('');
const renderError = ref();

watch(
    () => [props.code, themeStore.theme.value],
    async () => {
        try {
            renderError.value = undefined;
            result.value = await renderMermaid(props.code);
        } catch (e) {
            renderError.value = e;
            result.value = '';
        }
    },
    {immediate: true},
);
</script>

<template>
    <template v-if="!renderError">
        <div
            class="mermaid"
            v-html="result"
        />
        <details class="mermaid-source-code">
            <summary>Source Code</summary>
            <MarkdownCode
                :code="props.code"
                language="mermaid"
            />
        </details>
    </template>
    <div
        v-else
        class="mermaid error"
    >
        <MarkdownCode
            :code="props.code"
            language="mermaid"
        />
        <div class="error-detail">{{ renderError }}</div>
    </div>
</template>
