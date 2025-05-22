<script setup lang="ts">
import MindMap from "@/mindMap/MindMap.vue";
import {useThemeStore} from "@/store/themeStore.ts";

useThemeStore()
</script>

<template>
    <div style="height: 100vh; width: 100vw;">
        <MindMap/>
    </div>
</template>
