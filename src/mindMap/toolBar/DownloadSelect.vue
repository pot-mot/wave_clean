<script setup lang="ts">
import {ExportType_CONSTANT} from "@/file/htmlExport.ts";
import {useMindMap} from "@/mindMap/useMindMap.ts";
import IconDownload from "@/icons/IconDownload.vue";

const {exportFileType, exportFile} = useMindMap()
</script>

<template>
    <div class="download-select-wrapper">
        <IconDownload class="icon" @click="exportFile()"/>

        <select v-model="exportFileType" @change="exportFile()">
            <option v-for="type in ExportType_CONSTANT">
                {{ type }}
            </option>
        </select>
    </div>
</template>

<style scoped>
.download-select-wrapper {
    position: relative;
    display: flex;
    background-color: var(--background-color);
    transition: background-color 0.5s ease;
}

.download-select-wrapper:hover {
    background-color: var(--background-color-hover);
}

.download-select-wrapper > .icon {
    position: relative;
    top: 50%;
    transform: translateY(-50%);
}

.download-select-wrapper select {
    border: none;
    cursor: pointer;
    background-color: var(--background-color);
    transition: background-color 0.5s ease;
    font-size: 0.8rem;
}

.download-select-wrapper select:hover {
    background-color: var(--background-color-hover);
}
</style>
