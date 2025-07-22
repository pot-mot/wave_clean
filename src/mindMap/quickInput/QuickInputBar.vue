<script setup lang="ts">
import {QuickInputItem, useMindMapMetaStore} from "@/mindMap/meta/MindMapMetaStore.ts";
import {useFocusTargetStore} from "@/store/focusTargetStore.ts";
import {outsideInput} from "@/utils/event/outsideInput.ts";
import CollapseItem from "@/components/collapse/CollapseItem.vue";

const metaStore = useMindMapMetaStore()

const focusTargetStore = useFocusTargetStore()

const handleQuickInput = (quickInput: QuickInputItem) => {
    outsideInput(focusTargetStore.focusTarget.value, quickInput.value)
}
</script>

<template>
    <CollapseItem
        class="quick-input-bar-container"
        min-height="2rem"
        max-height="8rem"
    >
        <div class="quick-input-bar">
            <button
                class="quick-input-item"
                v-for="quickInput in metaStore.meta.value.quickInputs"
                :key="quickInput.id"
                @touchend.prevent="handleQuickInput(quickInput)"
            >
                {{ quickInput.label }}
            </button>
        </div>
    </CollapseItem>
</template>

<style scoped>
.quick-input-bar-container :deep(.collapse-item-body::-webkit-scrollbar) {
    width: 0;
    height: 0;
}

.quick-input-bar {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    padding-left: 0.5rem;
}

.quick-input-item {
    height: 2rem;
    line-height: 2rem;
    padding: 0 0.6rem;
    border: none;
    cursor: pointer;
}
</style>
