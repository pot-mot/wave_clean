<script setup lang="ts">
import {computed, ref} from 'vue';
import {renderKatex} from './render.ts';
import MarkdownCode from '../code/MarkdownCode.vue';

const props = defineProps<{
    code: string;
}>();

const renderError = ref();

const result = computed(() => {
    try {
        renderError.value = undefined;
        return renderKatex(props.code, {displayMode: false});
    } catch (e) {
        renderError.value = e;
    }
});
</script>

<template>
    <span
        v-if="!renderError"
        class="katex"
        v-html="result"
    />
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
