<script setup lang="ts">
import {QuickInputItem, useMindMapMetaStore} from "@/mindMap/meta/MindMapMetaStore.ts";
import {useFocusTargetStore} from "@/store/focusTargetStore.ts";
import {outsideInput} from "@/utils/event/outsideInput.ts";

const metaStore = useMindMapMetaStore()

const focusTargetStore = useFocusTargetStore()

const handleQuickInput = (quickInput: QuickInputItem) => {
    outsideInput(focusTargetStore.focusTarget.value, quickInput.value)
}
</script>

<template>
    <div style="display: flex; gap: 0.5rem;">
        <button
            v-for="quickInput in metaStore.meta.value.quickInputs"
            :key="quickInput.id"
            @touchend.prevent="handleQuickInput(quickInput)"
            style="padding: 0 0.5rem; border: none;"
        >
            {{ quickInput.label }}
        </button>
    </div>
</template>
