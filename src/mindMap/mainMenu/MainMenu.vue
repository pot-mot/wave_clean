<script setup lang="ts">
import FileMenu from "@/mindMap/mainMenu/file/FileMenu.vue";
import QuickInputMenu from "@/mindMap/mainMenu/quickInput/QuickInputMenu.vue";
import {ref} from "vue";
import {useDeviceStore} from "@/store/deviceStore.ts";
import {translate} from "@/store/i18nStore.ts";
import ConfigMenu from "@/mindMap/mainMenu/config/ConfigMenu.vue";

const {isTouchDevice} = useDeviceStore()

type SubMenuType = 'file' | 'quick-input'

const subMenuType = ref<SubMenuType>('file')
</script>

<template>
    <div class="main-menu">
        <div class="sub-menu-container">
            <template v-if="isTouchDevice">
                <div class="sub-menu-select">
                    <button @click="subMenuType = 'file'" :class="{enable: subMenuType === 'file'}">
                        {{ translate('mindMap') }}
                    </button>
                    <button @click="subMenuType = 'quick-input'" :class="{enable: subMenuType === 'quick-input'}">
                        {{ translate('quickInput') }}
                    </button>
                </div>

                <div class="sub-menu-wrapper">
                    <FileMenu v-if="subMenuType === 'file'"/>
                    <QuickInputMenu v-else-if="subMenuType === 'quick-input'"/>
                </div>
            </template>

            <FileMenu v-else/>
        </div>

        <ConfigMenu/>
    </div>
</template>

<style scoped>
.main-menu {
    height: 100%;
    width: 100%;
    background-color: var(--background-color);
    transition: background-color 0.5s;
}
.sub-menu-container {
    height: calc(100% - 2rem);
}

.sub-menu-select {
    width: 100%;
    height: 2rem;
    display: grid;
    grid-template-columns: 1fr 1fr;
}

.sub-menu-select > button {
    transition: background-color 0.5s ease;
    border-left: none;
    border-top: none;
}

.sub-menu-select > button.enable {
    background-color: var(--background-color-hover);
    border-color: var(--border-color-light);
}

.sub-menu-wrapper {
    height: calc(100% - 2rem);
}
</style>
