<script setup lang="ts">
import IconDelete from "@/icons/IconDelete.vue";
import {QuickInputItem, useMindMapMetaStore} from "@/mindMap/meta/MindMapMetaStore.ts";
import {ref} from "vue";
import {sendMessage} from "@/message/sendMessage.ts";
import IconAdd from "@/icons/IconAdd.vue";
import DragModelList from "@/list/DragModelList.vue";

const metaStore = useMindMapMetaStore()

const currentItem = ref<QuickInputItem | undefined>(undefined)

const handleToggleCurrent = (item: QuickInputItem) => {
    currentItem.value = item
}

const getDefaultQuickInput = () => {
    return {
        id: Date.now().toString(),
        label: "",
        value: "",
    }
}
const input = ref<QuickInputItem>(getDefaultQuickInput())

const handleAdd = () => {
    if (input.value.label.length === 0 || input.value.value.length === 0) {
        sendMessage("Please set label and value")
        return
    }
    metaStore.meta.value.quickInputs.push(input.value)
    input.value = getDefaultQuickInput()
}

const handleDelete = (item: QuickInputItem) => {
    metaStore.meta.value.quickInputs = metaStore.meta.value.quickInputs.filter(it => it.id !== item.id)
}
</script>

<template>
    <div class="quick-input-menu">
        <div class="new-quick-input">
            <input
                class="label-input"
                v-model="input.label"
                @click.stop
            >
            <input
                class="value-input"
                v-model="input.value"
                @click.stop
            >
            <button @click="handleAdd">
                <IconAdd/>
            </button>
        </div>

        <DragModelList
            class="quick-input-list"
            v-model="metaStore.meta.value.quickInputs"
            :current-item="currentItem"
            :to-key="quickInput => quickInput.id"
            @remove="quickInput => handleDelete(quickInput)"
        >
            <template #default="{item: quickInput}">
                <div class="quick-input-item" @click="handleToggleCurrent(quickInput)">
                    <input
                        class="label-input"
                        v-model="quickInput.label"
                        @click.stop
                    >
                    <input
                        class="value-input"
                        v-model="quickInput.value"
                        @click.stop
                    >

                    <button
                        class="quick-input-item-delete-button"
                        @click.stop="handleDelete(quickInput)"
                    >
                        <IconDelete/>
                    </button>
                </div>
            </template>

            <template #dragView="{data: {item: quickInput}}">
                <div class="quick-input-item-drag-view ">
                    <span>{{ quickInput.label }}</span>
                    <span>{{ quickInput.value }}</span>
                </div>
            </template>
        </DragModelList>
    </div>
</template>

<style scoped>
.quick-input-menu {
    height: 100%;
    width: 100%;
    padding: 0.5rem;
}

.quick-input-list {
    position: relative;
    height: calc(100% - 1.5rem);
    overflow-x: hidden;
    overflow-y: auto;
}

.new-quick-input {
    display: grid;
    grid-gap: 0.5rem;
    grid-template-columns: 1fr 1fr 2rem;
    height: 1.5rem;
    line-height: 1.5rem;
    margin-bottom: 0.5rem;
}

.quick-input-item {
    display: grid;
    grid-gap: 0.5rem;
    grid-template-columns: 1fr 1fr 2rem;
    user-select: none;
    height: 1.5rem;
    line-height: 1.5rem;
}

.quick-input-item-drag-view {
    display: grid;
    grid-gap: 0.5rem;
    grid-template-columns: 1fr 1fr 2rem;
    height: 1.5rem;
    line-height: 1.5rem;
    user-select: none;
    opacity: 0.8;
    background-color: var(--primary-color);
}

.quick-input-item-delete-button {
    height: 1.5rem;
    line-height: 1.5rem;
    padding: 0 0.5rem;
}

.label-input,
.value-input {
    width: 100%;
    background-color: transparent;
    border: none;
    pointer-events: none;
    cursor: default;
}

.current .label-input,
.current .value-input {
    width: 100%;
    pointer-events: all;
    cursor: text;
}

.new-quick-input .label-input,
.new-quick-input .value-input {
    background-color: var(--background-color);
    border: var(--border);
    border-color: var(--background-color-hover);
    pointer-events: all;
}

.new-quick-input .label-input:focus,
.new-quick-input .value-input:focus {
    border-color: var(--border-color);
}

.current .label-input:focus,
.current .value-input:focus {
    background-color: var(--background-color);
    border: var(--border);
    pointer-events: all;
}
</style>
