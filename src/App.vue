<script setup lang="ts">
import MindMap from "@/mindMap/MindMap.vue";
import {useThemeStore} from "@/store/themeStore.ts";
import {useFocusTargetStore} from "@/store/focusTargetStore.ts";

useThemeStore()
useFocusTargetStore()
</script>

<template>
    <MindMap/>
</template>
