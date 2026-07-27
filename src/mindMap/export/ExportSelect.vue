<script setup lang="ts">
import {useMindMap} from '@/mindMap/useMindMap.ts';
import IconDownload from '@/components/icons/IconDownload.vue';
import {ExportFileType_CONSTANTS} from '@/mindMap/export/export.ts';
import CustomSelect from '@/components/select/CustomSelect.vue';
import {createOptions} from '@/components/select/createOptions.ts';

const {exportFileType, exportFile} = useMindMap();

const exportOptions = createOptions(ExportFileType_CONSTANTS);
</script>

<template>
    <div class="download-select-wrapper">
        <button
            class="download-button"
            @click="exportFile()"
        >
            <IconDownload class="icon" />
        </button>

        <CustomSelect
            v-model="exportFileType"
            :options="exportOptions"
        />
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

.download-select-wrapper :deep(.custom-select-trigger) {
    border: none;
    font-size: 0.8rem;
}
</style>
