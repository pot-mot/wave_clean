<script setup lang="ts">
import IconDelete from '@/components/icons/IconDelete.vue';
import {type MindMapMetaData, useMindMapStore} from '@/store/mindMapStore.ts';
import {computed, ref} from 'vue';
import {sendMessage} from '@/components/message/messageApi.ts';
import IconAdd from '@/components/icons/IconAdd.vue';
import DragModelList from '@/components/list/DragModelList.vue';
import {formatDatetimeToLocal} from '@/utils/datetime/datetimeFormat.ts';
import CollapseDetail from '@/components/collapse/CollapseDetail.vue';
import {sendConfirm} from '@/components/confirm/confirmApi.ts';
import {translate} from '@/store/i18nStore.ts';
import IconDownload from '@/components/icons/IconDownload.vue';
import {exportMindMapToJson} from '@/mindMap/export/export.ts';
import {withLoading} from '@/components/loading/loadingApi.ts';
import IconLoad from '@/components/icons/IconLoad.vue';
import {readJson, removeJsonSuffix} from '@/utils/file/jsonRead.ts';
import {validateMindMapData} from '@/mindMap/MindMapData.ts';
import {confirmSave} from '@/mindMap/closeSave/closeSave.ts';
import IconCheck from '@/components/icons/IconCheck.vue';
import IconClose from '@/components/icons/IconClose.vue';
import Dialog from '@/components/dialog/Dialog.vue';

const mindMapStore = useMindMapStore();

const currentFile = computed(() => {
    return mindMapStore.meta.value.mindMaps.find(
        (it) => it.key === mindMapStore.meta.value.currentKey,
    );
});

const isFileAddDialogOpen = ref(false);
const newName = ref('');

const handleAddStart = () => {
    newName.value = '';
    isFileAddDialogOpen.value = true;
};

const handleAddCancel = () => {
    isFileAddDialogOpen.value = false;
};

const handleAddSubmit = () => {
    if (newName.value.length === 0) {
        sendMessage('Please set a name', {type: 'warning'});
        return;
    }
    mindMapStore.add(0, newName.value);
    isFileAddDialogOpen.value = false;
    newName.value = '';
};

const handleLoad = async () => {
    try {
        const mindMapData = await readJson(validateMindMapData);
        if (mindMapData !== undefined) {
            await mindMapStore.load(0, removeJsonSuffix(mindMapData.name), mindMapData.data);
        }
    } catch (e) {
        sendMessage(`${translate('load_mindMap_fail')}`, {type: 'error'});
        throw e;
    }
};

const handleOpen = async (key: string) => {
    const shouldSave = await mindMapStore.shouldSave();
    if (shouldSave) {
        await confirmSave();
    }
    await mindMapStore.toggle(key);
};

const handleRename = (key: string, e: Event) => {
    if (e.target instanceof HTMLInputElement) {
        mindMapStore.rename(key, e.target.value);
        e.target.blur();
    }
};

const handleDownload = async (mindMap: {name: string; key: string}) => {
    await withLoading('Download MindMap', async () => {
        try {
            const mindMapData = await mindMapStore.get(mindMap.key);
            const savePath = await exportMindMapToJson(mindMap.name, mindMapData);
            if (typeof savePath === 'string') {
                sendMessage(`${translate('export_mindMap_success')}\n${savePath}`, {
                    type: 'success',
                });
            } else if (savePath !== null) {
                sendMessage(translate('export_mindMap_fail'), {type: 'error'});
            }
        } catch (e) {
            sendMessage(`${translate('export_mindMap_fail')}\n${e}`, {type: 'error'});
            throw e;
        }
    });
};

const handleDelete = async (mindMap: {name: string; key: string}) => {
    await sendConfirm({
        title: translate({key: 'delete_confirm_title', args: [translate('mindMap')]}),
        content: translate({
            key: 'delete_confirm_content',
            args: [`${translate('mindMap')}[${mindMap.name}]`],
        }),
        onConfirm: () => {
            mindMapStore.remove(mindMap.key);
        },
    });
};
</script>

<template>
    <div class="file-menu">
        <div class="file-menu-header">
            <button
                class="mindMap-create-button"
                @click="handleAddStart"
            >
                <IconAdd />
            </button>
            <button
                class="load-file-button"
                @click="handleLoad"
            >
                <IconLoad />
            </button>

            <Dialog
                v-if="isFileAddDialogOpen"
                :title="translate('mindMap_create_dialog_title')"
                :onClose="handleAddCancel"
            >
                <input
                    class="mind-map-name-input"
                    v-model="newName"
                    :placeholder="translate('mindMap_title_placeholder')"
                    @keydown.enter="handleAddStart"
                />
                <div class="confirm-actions">
                    <button
                        @click="handleAddCancel"
                        class="cancel-button"
                    >
                        <IconClose />
                        {{ translate('cancel') }}
                    </button>
                    <button
                        @click="handleAddSubmit"
                        class="confirm-button"
                    >
                        <IconCheck />
                        {{ translate('confirm') }}
                    </button>
                </div>
            </Dialog>
        </div>

        <DragModelList
            class="file-list"
            v-model="mindMapStore.meta.value.mindMaps"
            :current-item="currentFile"
            :to-key="(mindMap: MindMapMetaData) => mindMap.key"
            @remove="(mindMap: MindMapMetaData) => mindMapStore.remove(mindMap.key)"
        >
            <template #default="{item: mindMap}">
                <CollapseDetail>
                    <template #head>
                        <div
                            class="file-item"
                            @click="handleOpen(mindMap.key)"
                        >
                            <div>
                                <input
                                    class="file-name"
                                    :value="mindMap.name"
                                    @change="(e: Event) => handleRename(mindMap.key, e)"
                                    @click.stop
                                />
                                <div class="last-edit-time">
                                    {{
                                        formatDatetimeToLocal(
                                            mindMap.lastEditTime ?? mindMap.createdTime,
                                        )
                                    }}
                                </div>
                            </div>
                        </div>
                    </template>

                    <template #body>
                        <div class="file-item-operations">
                            <button @click.stop="handleDownload(mindMap)">
                                <IconDownload />
                            </button>

                            <button @click.stop="handleDelete(mindMap)">
                                <IconDelete />
                            </button>
                        </div>
                    </template>
                </CollapseDetail>
            </template>

            <template #dragView="{data: {item: mindMap}}">
                <div class="file-item-drag-view">
                    <div>
                        <input
                            class="file-name"
                            :value="mindMap.name"
                        />
                        <div class="last-edit-time">
                            {{ formatDatetimeToLocal(mindMap.lastEditTime ?? mindMap.createdTime) }}
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
}

.file-menu-header {
    display: grid;
    width: 100%;
    grid-template-columns: 1fr auto;
    height: 2rem;
    line-height: 1.5rem;
}

.mindMap-create-button {
    border: none;
    border-radius: 0;
}

.load-file-button {
    width: 1.5rem;
    border: none;
}

.file-list {
    position: relative;
    height: calc(100% - 1.5rem);
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
    padding: 0 0.25rem;
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

.file-item-operations {
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
    padding: 0 0.5rem 0.5rem;
}

.file-item-operations button {
    height: 1.5rem;
    width: 1.5rem;
}

.file-item-operations button {
    height: 1.5rem;
    min-width: 1.5rem;
}

.file-item-operations button.disabled {
    background-color: var(--background-color-hover);
    cursor: not-allowed;
}

.file-item-operations button:hover {
    background-color: var(--background-color-hover);
}

.mind-map-name-input {
    border-radius: 0.25rem;
    padding: 0.25rem 0.5rem;
    width: 100%;
    font-size: 1rem;
}

.confirm-actions {
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
    margin-top: 0.5rem;
    padding: 0.5rem;
}

.cancel-button,
.confirm-button {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.25rem 0.5rem;
    border: var(--border);
    border-color: var(--border-color-light);
    border-radius: var(--border-radius);
    cursor: pointer;
    font-size: 0.8rem;
}

.cancel-button {
    border-color: var(--warning-color);
    --icon-color: var(--warning-color);
}

.confirm-button {
    border-color: var(--success-color);
    --icon-color: var(--success-color);
}
</style>
