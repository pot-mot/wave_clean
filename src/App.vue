<script setup lang="ts">
import MindMap from "@/mindMap/MindMap.vue";
import {initDeviceStore} from "@/store/deviceStore.ts";
import {initThemeStore} from "@/store/themeStore.ts";
import {initFocusTargetStore} from "@/store/focusTargetStore.ts";
import {initMonacoMarkdownLanguage} from "@/components/markdown/editor/markdownLanguage.ts";
import {useMarkdownImageImport} from "@/components/markdown/editor/image/markdownImageImport.ts";
import {registerCustomCommands} from "@/components/markdown/editor/command/customCommand.ts";

initDeviceStore()
initThemeStore()
initFocusTargetStore()

registerCustomCommands()
initMonacoMarkdownLanguage()
useMarkdownImageImport()
</script>

<template>
    <MindMap/>
</template>
