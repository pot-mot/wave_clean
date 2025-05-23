<script setup lang="ts">
import {useThemeStore} from "@/store/themeStore.ts";
import IconDark from "@/icons/IconDark.vue";
import IconLight from "@/icons/IconLight.vue";
import FileMenu from "@/mindMap/meta/FileMenu.vue";

const themeStore = useThemeStore()

const handlePrimaryColorChange = (e: Event) => {
    if (e.target instanceof HTMLInputElement) {
        themeStore.setPrimaryColor(e.target.value)
    }
}
</script>

<template>
    <div class="meta-menu">
        <div class="theme-menu">
            <button @click="themeStore.toggleTheme()">
                <IconLight v-if="themeStore.theme.value === 'light'"/>
                <IconDark v-else-if="themeStore.theme.value === 'dark'"/>
            </button>
            <input type="color" :value="themeStore.primaryColor.value" @change="handlePrimaryColorChange">
        </div>

        <div class="quick-input-menu">

        </div>

        <FileMenu/>
    </div>
</template>

<style scoped>
.meta-menu {
    height: 100%;
    width: 100%;
    background-color: var(--background-color);
    transition: background-color 0.5s;
}
</style>
