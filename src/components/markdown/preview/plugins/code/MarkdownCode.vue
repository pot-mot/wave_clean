<script setup lang="ts">
import {computed} from 'vue';
import {copyText} from '@/utils/clipBoard/useClipBoard.ts';
import {sendMessage} from '@/components/message/messageApi.ts';
import {renderCodeByPrism} from './render.ts';
import {translate} from '@/store/i18nStore.ts';

const props = defineProps<{
    code: string;
    language: string;
}>();

const renderedCode = computed(() => {
    return renderCodeByPrism(props.code, props.language);
});

const lineNumbers = computed(() => {
    const lines = [];
    for (let i = 1; i <= renderedCode.value.lineCount; i++) {
        lines.push(i);
    }
    return lines.join('\n');
});

const handleCopyCode = () => {
    try {
        copyText(props.code);
        sendMessage(translate('copy_success'), {type: 'success'});
    } catch (e) {
        sendMessage(`${translate('copy_fail')}: ${e}`, {type: 'warning'});
    }
};
</script>

<template>
    <div class="code-block">
        <div class="line-numbers">{{ lineNumbers }}</div>
        <pre
            :class="language.length > 0 ? `language-${language}` : ''"
        ><code v-html="renderedCode.result"/></pre>
        <button
            class="code-copy-button"
            title="copy"
            @click="handleCopyCode"
        />
        <div class="code-language">{{ language }}</div>
    </div>
</template>

<style scoped>
@import 'style.css';
</style>
