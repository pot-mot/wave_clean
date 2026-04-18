<script setup lang="ts">
import FileMenu from '@/mindMap/mainMenu/file/FileMenu.vue';
import ConfigMenu from '@/mindMap/mainMenu/config/ConfigMenu.vue';
</script>

<template>
    <div class="main-menu">
        <FileMenu />

        <ConfigMenu />
    </div>
</template>

<style scoped>
.main-menu {
    height: 100%;
    width: 100%;
    display: grid;
    grid-template-rows: 1fr auto;
    background-color: var(--background-color);
    transition: background-color 0.5s;
}
</style>
