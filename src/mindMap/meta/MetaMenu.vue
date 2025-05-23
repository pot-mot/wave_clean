<script setup lang="ts">
import {useThemeStore} from "@/store/themeStore.ts";
import IconDark from "@/icons/IconDark.vue";
import IconLight from "@/icons/IconLight.vue";
import FileMenu from "@/mindMap/meta/FileMenu.vue";
import QuickInputMenu from "@/mindMap/meta/QuickInputMenu.vue";
import {useMindMapMetaStore} from "@/mindMap/meta/MindMapMetaStore.ts";

const metaStore = useMindMapMetaStore()

const themeStore = useThemeStore()

const handlePrimaryColorChange = (e: Event) => {
    if (e.target instanceof HTMLInputElement) {
        themeStore.setPrimaryColor(e.target.value)
    }
}
</script>

<template>
    <div class="meta-menu">
        <h2>{{ metaStore.meta.value.currentKey }}</h2>

        <div class="theme-menu">
            <button @click="themeStore.toggleTheme()">
                <IconLight v-if="themeStore.theme.value === 'light'"/>
                <IconDark v-else-if="themeStore.theme.value === 'dark'"/>
            </button>
            <input type="color" :value="themeStore.primaryColor.value" @change="handlePrimaryColorChange">
        </div>

        <div class="sub-menu-container">
            <QuickInputMenu/>
            <FileMenu/>
        </div>
    </div>
</template>

<style scoped>
.meta-menu {
    height: 100%;
    width: 100%;
    background-color: var(--background-color);
    transition: background-color 0.5s;
}

.sub-menu-container {

}
</style>
