<script setup lang="ts">
import {ExportType_CONSTANT} from "@/file/htmlExport.ts";
import {useMindMap} from "@/mindMap/useMindMap.ts";
import IconDownload from "@/icons/IconDownload.vue";

const {exportFileType, exportFile} = useMindMap()
</script>

<template>
    <div class="download-select-wrapper">
        <button class="download-button" @click="exportFile()">
            <IconDownload class="icon"/>
        </button>

        <select v-model="exportFileType" @change="exportFile()">
            <option v-for="type in ExportType_CONSTANT">
                {{ type }}
            </option>
        </select>
    </div>
</template>

<style scoped>
.download-select-wrapper {
    display: flex;
}

.download-select-wrapper > .download-button {
    padding: 0 0.3rem;
    border: none;
    height: 100%;
    background-color: var(--background-color);
    transition: background-color 0.5s ease;
}

.download-select-wrapper > .download-button:hover {
    background-color: var(--background-color-hover);
}

.download-select-wrapper > select {
    border: none;
    cursor: pointer;
    background-color: var(--background-color);
    transition: background-color 0.5s ease;
    font-size: 0.8rem;
}

.download-select-wrapper > select:hover {
    background-color: var(--background-color-hover);
}
</style>
