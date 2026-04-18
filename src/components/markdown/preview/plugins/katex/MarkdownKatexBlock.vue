<script setup lang="ts">
import {ref, watch} from 'vue';
import {renderKatex} from './render.ts';
import MarkdownCode from '../code/MarkdownCode.vue';

const props = defineProps<{
    code: string;
}>();

const result = ref<string>('');
const renderError = ref();

watch(
    () => [props.code],
    () => {
        try {
            renderError.value = undefined;
            result.value = renderKatex(props.code, {displayMode: true});
        } catch (e) {
            renderError.value = e;
        }
    },
    {immediate: true},
);
</script>

<template>
    <template v-if="!renderError">
        <div
            class="katex"
            v-html="result"
        />
        <details class="katex-source-code">
            <summary>Source Code</summary>
            <MarkdownCode
                :code="props.code"
                language="latex"
            />
        </details>
    </template>
    <div
        v-else
        class="katex error"
    >
        <MarkdownCode
            :code="props.code"
            language="latex"
        />
        <div class="error-detail">{{ renderError }}</div>
    </div>
</template>
