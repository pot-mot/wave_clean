<script setup lang="ts">
import {useMindMapMetaStore} from "@/mindMap/meta/MindMapMetaStore.ts";
import {ref} from "vue";
import IconAdd from "@/icons/IconAdd.vue";
import IconDelete from "@/icons/IconDelete.vue";
import {sendMessage} from "@/message/sendMessage.ts";
import {useThemeStore} from "@/store/themeStore.ts";
import IconDark from "@/icons/IconDark.vue";
import IconLight from "@/icons/IconLight.vue";

const metaStore = useMindMapMetaStore()
const themeStore = useThemeStore()

const name = ref("")

const handleAdd = () => {
    if (name.value.length === 0) {
        sendMessage("Please set a name")
        return
    }
    metaStore.add(0, name.value)
    name.value = ""
}

const handleDelete = (key: string) => {
    metaStore.remove(key)
}

const handleOpen = (key: string) => {
    metaStore.toggle(key)
}

const handleRename = (key: string, e: Event) => {
    if (e.target instanceof HTMLInputElement) {
        metaStore.rename(key, e.target.value)
        e.target.blur()
    }
}

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

        <div class="file-menu">
            <div class="new-file-wrapper">
                <input
                    class="new-file-name"
                    v-model="name" @keydown.enter="handleAdd"
                >
                <button
                    class="new-file-button"
                    @click="handleAdd"
                >
                    <IconAdd/>
                </button>
            </div>

            <div class="file-list">
                <div
                    class="file-item"
                    v-for="mindMap in metaStore.meta.value.mindMaps"
                    @click="handleOpen(mindMap.key)"
                    :class="{current: mindMap.key === metaStore.meta.value.currentKey}"
                >
                    <div>
                        <input
                            class="file-name"
                            :value="mindMap.name"
                            @change="(e) => handleRename(mindMap.key, e)"
                            @click.stop
                        >
                        <div
                            class="last-edit-time"
                        >
                            {{ mindMap.lastEditTime }}
                        </div>
                    </div>

                    <button
                        class="file-delete-button"
                        @click.stop="handleDelete(mindMap.key)"
                    >
                        <IconDelete/>
                    </button>
                </div>
            </div>
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

.file-menu {
    height: calc(100% - 3rem);
    width: 100%;
    padding: 0.5rem;
    background-color: var(--background-color);
    transition: background-color 0.5s;
}

.new-file-wrapper {
    display: grid;
    width: 100%;
    grid-template-columns: 1fr auto;
    height: 1.5rem;
    line-height: 1.5rem;
}

.new-file-name {
    height: 100%;
    border-radius: 0;
    padding: 0 0.5rem;
}

.new-file-button {
    width: 2rem;
    border-left: none;
    border-radius: 0;
}

.file-list {
    height: calc(100% - 1.5rem);
    padding-bottom: 3rem;
    overflow-x: hidden;
    overflow-y: auto;
}

.file-item {
    margin-top: 0.5rem;
    display: grid;
    grid-template-columns: 1fr auto;
    background-color: var(--background-color);
    transition: background-color 0.5s;
}

.file-item.current,
.file-item.current .file-name {
    color: var(--primary-color);
}

.file-name {
    width: 100%;
    height: 1.5rem;
    line-height: 1.5rem;
    background-color: transparent;
    border: none;
    border-radius: 0;
    font-size: 1rem;
    margin-top: 0.5rem;
    pointer-events: none;
}

.current .file-name {
    pointer-events: all;
}

.file-name:focus {
    background-color: var(--background-color);
    padding: 0 0.5rem;
    border: var(--border);
    outline: none;
    cursor: text;
    color: var(--text-color);
}

.file-item.current .file-name:focus {
    color: var(--text-color);
}

.last-edit-time {
    font-size: 0.8rem;
    cursor: default;
}

.file-delete-button {
    height: 2rem;
    margin-top: 0.5rem;
    line-height: 2rem;
    padding: 0 0.5rem;
}
</style>
