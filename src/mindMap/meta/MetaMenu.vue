<script setup lang="ts">
import {useThemeStore} from "@/store/themeStore.ts";
import IconDark from "@/components/icons/IconDark.vue";
import IconLight from "@/components/icons/IconLight.vue";
import FileMenu from "@/mindMap/file/FileMenu.vue";
import QuickInputMenu from "@/mindMap/quickInput/QuickInputMenu.vue";
import {useMindMapMetaStore} from "@/mindMap/meta/MindMapMetaStore.ts";
import {computed, ref} from "vue";
import {useDeviceStore} from "@/store/deviceStore.ts";
import ColorInput from "@/components/color/ColorInput.vue";

const metaStore = useMindMapMetaStore()

const themeStore = useThemeStore()

const {isTouchDevice} = useDeviceStore()

const primaryColor = computed({
    get(): string {
        return themeStore.primaryColor.value
    },
    set(color: string) {
        themeStore.setPrimaryColor(color)
    }
})

type SubMenuType = 'file' | 'quick-input'

const subMenuType = ref<SubMenuType>('file')
</script>

<template>
    <div class="meta-menu">
        <h1 class="current-title">
            {{ metaStore.currentMindMap.value?.name ?? 'untitled'}}
        </h1>

        <div class="sub-menu-container">
            <template v-if="isTouchDevice">
                <div class="sub-menu-select">
                    <button @click="subMenuType = 'file'" :class="{enable: subMenuType === 'file'}">Mind Map</button>
                    <button @click="subMenuType = 'quick-input'" :class="{enable: subMenuType === 'quick-input'}">Quick Input</button>
                </div>

                <div class="sub-menu-wrapper">
                    <FileMenu v-if="subMenuType === 'file'"/>
                    <QuickInputMenu v-else-if="subMenuType === 'quick-input'"/>
                </div>
            </template>

            <FileMenu v-else/>
        </div>

        <div class="theme-menu">
            <span>
                primary color
                <ColorInput v-model="primaryColor"/>
            </span>

            <span>
                theme
                <button @click="themeStore.toggleTheme()">
                    <IconLight v-if="themeStore.theme.value === 'light'"/>
                    <IconDark v-else-if="themeStore.theme.value === 'dark'"/>
                </button>
            </span>
        </div>
    </div>
</template>

<style scoped>
.current-title {
    height: 2rem;
    line-height: 2rem;
    display: block;
    padding: 0 0.5rem;
    font-size: 1.1rem;
    white-space: nowrap;
    overflow-x: scroll;
    overflow-y: hidden;
}

.meta-menu {
    height: 100%;
    width: 100%;
    background-color: var(--background-color);
    transition: background-color 0.5s;
}
.sub-menu-container {
    height: calc(100% - 4rem);
}

.sub-menu-select {
    width: 100%;
    height: 2rem;
    display: grid;
    grid-template-columns: 1fr 1fr;
}

.sub-menu-select > button {
    transition: background-color 0.5s ease;
}

.sub-menu-select > button.enable {
    background-color: var(--background-color-hover);
}

.sub-menu-wrapper {
    height: calc(100% - 2rem);
}

.theme-menu {
    width: 100%;
    display: flex;
    justify-content: space-around;
    height: 2rem;
    line-height: 2rem;
    overflow-x: auto;
    overflow-y: hidden;
    gap: 1rem;
}

.theme-menu > span {
    white-space: nowrap;
}
</style>
