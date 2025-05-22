<script setup lang="ts">
import {useMindMapFileStore} from "@/mindMap/file/MindMapFileStore.ts";
import {ref} from "vue";
import IconAdd from "@/icons/IconAdd.vue";
import IconDelete from "@/icons/IconDelete.vue";
import {sendMessage} from "@/message/sendMessage.ts";

const fileStore = useMindMapFileStore()

const name = ref("")

const handleAdd = () => {
    if (name.value.length === 0) {
        sendMessage("Please set a name")
        return
    }
    fileStore.add(0, name.value)
    name.value = ""
}

const handleDelete = (key: string) => {
    fileStore.remove(key)
}

const handleOpen = (key: string) => {
    fileStore.toggle(key)
}

const handleRename = (key: string, e: Event) => {
    if (e.target instanceof HTMLInputElement) {
        fileStore.rename(key, e.target.value)
        e.target.blur()
    }
}
</script>

<template>
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
                v-for="mindMap in fileStore.meta.value.mindMaps"
                @click="handleOpen(mindMap.key)"
                :class="{current: mindMap.key === fileStore.meta.value.currentKey}"
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
</template>

<style scoped>
.file-menu {
    height: 100%;
    width: 100%;
    background-color: var(--background-color);
    padding: 0.5rem;
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
    background-color: var(--background-color);
    border: var(--border);
    border-radius: 0;
    padding: 0 0.5rem;
}

.new-file-name:focus {
    outline: none;
}

.new-file-button {
    width: 2rem;
    border: var(--border);
    border-left: none;
    border-radius: 0;
    background-color: var(--background-color);
}

.file-list {
    height: calc(100% - 1.5rem);
    overflow-y: auto;
    scrollbar-gutter: stable;
}

.file-item {
    margin-top: 0.5rem;
    display: grid;
    grid-template-columns: 1fr auto;
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
    color: unset;
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
