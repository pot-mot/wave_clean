<script setup lang="ts">
import MindMap from "@/mindMap/MindMap.vue";
import {useThemeStore} from "@/store/themeStore.ts";
import {useFocusTargetStore} from "@/store/focusTargetStore.ts";
import {initMonacoMarkdownLanguage} from "@/components/markdown/editor/markdownLanguage.ts";
import {useMarkdownImageImport} from "@/components/markdown/editor/image/markdownImageImport.ts";
import {registerCustomCommands} from "@/components/markdown/editor/command/customCommand.ts";

useThemeStore()
useFocusTargetStore()

registerCustomCommands()
initMonacoMarkdownLanguage()
useMarkdownImageImport()
</script>

<template>
    <MindMap/>
</template>
