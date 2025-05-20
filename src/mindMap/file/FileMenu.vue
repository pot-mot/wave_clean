<script setup lang="ts">
import {useMindMapFileStore} from "@/mindMap/file/MindMapFileStore.ts";
import {ref} from "vue";

const fileStore = useMindMapFileStore()

const name = ref("")

const handleAdd = () => {
    fileStore.add(0, name.value)
}

const handleDelete = (key: string) => {
    fileStore.remove(key)
}

const handleOpen = (key: string) => {
    fileStore.toggle(key)
}

const handleRename = (key: string, e: Event) => {
    if (e instanceof InputEvent && e.data !== null) {
        fileStore.rename(key, e.data)
    }
}
</script>

<template>
    <div class="file-menu">
        <input v-model="name">
        <button @click="handleAdd">add</button>
        <div
            v-for="mindMap in fileStore.meta.value.mindMaps"
            @click="handleOpen(mindMap.key)"
            :style="{color: mindMap.key === fileStore.meta.value.currentKey ? 'var(--primary-color)' : undefined}"
        >
            <input
                class="file-name"
                :value="mindMap.name"
                @change="handleRename(mindMap.key, $event)"
            >
            <div>
                {{ mindMap.lastEditTime }}
            </div>
            <button @click.stop="handleDelete(mindMap.key)">
                delete
            </button>
        </div>
    </div>
</template>

<style scoped>
.file-menu {
    height: 100%;
    width: 100%;
    background-color: var(--background-color);
    border: var(--border);
}

.file-name {
    height: 1rem;
    background-color: transparent;
    border: none;
}

.file-name:focus {
    background-color: var(--background-color);
    border: var(--border);
    cursor: text;
}
</style>
