<script setup lang="ts">
import {useMindMap} from "@/mindMap/useMindMap.ts";
import {useFileStore} from "@/mindMap/file/FileStore.ts";
import {ref} from "vue";

const fileStore = useFileStore()

const {
    currentMindMapKey,
    toggleMindMap,
} = useMindMap()

const name = ref("")

const handleAdd = () => {
    fileStore.add(0, name.value)
}

const handleOpen = (key: string) => {
    toggleMindMap(key)
}
</script>

<template>
    <div class="file-menu">
        <input v-model="name">
        <div @click="handleAdd">add</div>
        <div
            v-for="item in fileStore.meta.value.items"
            @click="handleOpen(item.key)"
            :style="{color: item.key === currentMindMapKey ? 'var(--primary-color)' : undefined}"
        >
            <div>
                {{ item.name }}
            </div>
            <div>
                {{ item.lastEditTime }}
            </div>
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
</style>
