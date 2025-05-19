<script setup lang="ts">
import {useMindMap} from "@/mindMap/useMindMap.ts";
import {useFileStore} from "@/mindMap/file/FileStore.ts";
import {ref} from "vue";

const fileStore = useFileStore()

const {
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
    <div>
        <input v-model="name">
        <div @click="handleAdd">add</div>
        <div v-for="item in fileStore.meta.value.items" @click="handleOpen(item.key)">
            {{ item.name }}
        </div>
    </div>
</template>
