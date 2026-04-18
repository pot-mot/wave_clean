<script setup lang="ts">
import {useMindMapStore} from '@/store/mindMapStore.ts';
import {useFocusTargetStore} from '@/store/focusTargetStore.ts';
import {outsideInput} from '@/utils/event/outsideInput.ts';
import CollapseItem from '@/components/collapse/CollapseItem.vue';
import type {QuickInputItem} from '@/mindMap/quickInput/QuickInput.ts';
import IconSettings from '@/components/icons/IconSettings.vue';
import QuickInputMenu from '@/mindMap/quickInput/QuickInputMenu.vue';
import {ref} from 'vue';
import Dialog from '@/components/dialog/Dialog.vue';
import {translate} from '@/store/i18nStore.ts';

const {meta} = useMindMapStore();

const focusTargetStore = useFocusTargetStore();

const handleQuickInput = (quickInput: QuickInputItem) => {
    outsideInput(focusTargetStore.focusTarget.value, quickInput.value);
};

const isSettingOpen = ref(false);

const openSettings = () => {
    isSettingOpen.value = true;
};

const closeSettings = () => {
    isSettingOpen.value = false;
};
</script>

<template>
    <div
        class="quick-input-bar-container"
        @touchend.prevent
    >
        <CollapseItem
            min-height="2rem"
            max-height="6.5rem"
        >
            <div class="quick-input-bar">
                <button
                    class="quick-input-item"
                    v-for="quickInput in meta.quickInputs"
                    :key="quickInput.id"
                    @touchend.prevent="handleQuickInput(quickInput)"
                >
                    {{ quickInput.label }}
                </button>
            </div>
        </CollapseItem>
        <button
            class="quick-input-settings"
            @touchend.prevent="openSettings"
        >
            <IconSettings />
        </button>
    </div>

    <Dialog
        v-if="isSettingOpen"
        :title="translate('quickInput_dialog_title')"
        :onClose="closeSettings"
    >
        <QuickInputMenu style="height: 80vh; width: 90vw" />
    </Dialog>
</template>

<style scoped>
.quick-input-bar-container {
    display: grid;
    grid-template-columns: 1fr auto;
}

.quick-input-settings {
    border: none;
}

.quick-input-bar {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    padding: 0.25rem 0.5rem;
}

.quick-input-item {
    height: 1.75rem;
    line-height: 1.75rem;
    padding: 0 0.5rem;
    border-radius: 0.25rem;
    white-space: nowrap;
    overflow-y: hidden;
    background-color: var(--background-color-hover);
    border: none;
    cursor: pointer;
}
</style>
