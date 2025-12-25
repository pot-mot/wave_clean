<script setup lang="ts">
import {useMindMapStore} from "@/store/mindMapStore.ts";
import {useFocusTargetStore} from "@/store/focusTargetStore.ts";
import {outsideInput} from "@/utils/event/outsideInput.ts";
import CollapseItem from "@/components/collapse/CollapseItem.vue";
import type {QuickInputItem} from "@/mindMap/quickInput/QuickInput.ts";

const {meta} = useMindMapStore()

const focusTargetStore = useFocusTargetStore()

const handleQuickInput = (quickInput: QuickInputItem) => {
    outsideInput(focusTargetStore.focusTarget.value, quickInput.value)
}
</script>

<template>
    <CollapseItem
        class="quick-input-bar-container"
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
</template>

<style scoped>
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
