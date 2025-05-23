<script setup lang="ts">
import IconDelete from "@/icons/IconDelete.vue";
import {useMindMapMetaStore} from "@/mindMap/meta/MindMapMetaStore.ts";
import {computed, ref} from "vue";
import {sendMessage} from "@/message/sendMessage.ts";
import IconAdd from "@/icons/IconAdd.vue";
import DragModelList from "@/list/DragModelList.vue";

const metaStore = useMindMapMetaStore()

const currentFile = computed(() => {
    return metaStore.meta.value.mindMaps.find(it => it.key === metaStore.meta.value.currentKey)
})

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

        <DragModelList
            class="file-list"
            v-model="metaStore.meta.value.mindMaps"
            :current-item="currentFile"
            :to-key="mindMap => mindMap.key"
            @remove="mindMap => metaStore.remove(mindMap.key)"
        >
            <template #default="{item: mindMap}">
                <div
                    class="file-item"
                    @click="handleOpen(mindMap.key)"
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
            </template>

            <template #dragView="{data: {item: mindMap}}">
                <div
                    class="file-item-drag-view"
                >
                    <div>
                        <input
                            class="file-name"
                            :value="mindMap.name"
                        >
                        <div
                            class="last-edit-time"
                        >
                            {{ mindMap.lastEditTime }}
                        </div>
                    </div>
                </div>
            </template>
        </DragModelList>
    </div>
</template>

<style scoped>
.file-menu {
    height: 100%;
    width: 100%;
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
    border-radius: 0;
    padding: 0 0.5rem;
}

.new-file-button {
    width: 2rem;
    border-left: none;
    border-radius: 0;
}

.file-list {
    position: relative;
    height: calc(100% - 1.5rem);
    padding-bottom: 3rem;
    overflow-x: hidden;
    overflow-y: auto;
}

.file-item {
    display: grid;
    padding: 0.5rem;
    grid-template-columns: 1fr 2rem;
    user-select: none;
}

.file-item-drag-view {
    display: grid;
    padding: 0.5rem;
    grid-template-columns: 1fr 2rem;
    user-select: none;
    opacity: 0.8;
    background-color: var(--primary-color);
}

.file-name {
    width: 100%;
    height: 1.5rem;
    line-height: 1.5rem;
    background-color: transparent;
    border: none;
    border-radius: 0;
    font-size: 1rem;
    pointer-events: none;
}

.current .file-name {
    pointer-events: all;
    color: var(--background-color);
}

.file-name:focus {
    background-color: var(--background-color);
    padding: 0 0.5rem;
    border: var(--border);
    outline: none;
    cursor: text;
    color: var(--text-color);
}

.current .file-name:focus {
    color: var(--text-color);
}

.last-edit-time {
    font-size: 0.8rem;
    cursor: default;
}

.current .last-edit-time {
    color: var(--background-color);
}

.file-delete-button {
    height: 2rem;
    margin-top: 0.5rem;
    line-height: 2rem;
    padding: 0 0.5rem;
}
</style>
