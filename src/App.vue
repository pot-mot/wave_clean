<script setup lang="ts">
import MindMap from "@/mindMap/MindMap.vue";
import {useThemeStore} from "@/store/themeStore.ts";

useThemeStore()
</script>

<template>
    <MindMap/>
</template>
