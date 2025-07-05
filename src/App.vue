<script setup lang="ts">
import MindMap from "@/mindMap/MindMap.vue";
import {useThemeStore} from "@/store/themeStore.ts";
import {useFocusTargetStore} from "@/store/focusTargetStore.ts";
import {initMonacoMarkdownLanguage} from "@/components/markdown/markdownCompletion.ts";

useThemeStore()
useFocusTargetStore()

initMonacoMarkdownLanguage()
</script>

<template>
    <MindMap/>
</template>
