<script setup lang="ts">
import {QuickInputItem, useMindMapMetaStore} from "@/mindMap/meta/MindMapMetaStore.ts";
import {useFocusTargetStore} from "@/store/focusTargetStore.ts";

const metaStore = useMindMapMetaStore()

const focusTargetStore = useFocusTargetStore()

const handleQuickInput = (quickInput: QuickInputItem) => {
    const focusTarget = focusTargetStore.focusTarget

    if (focusTarget.value instanceof HTMLInputElement || focusTarget.value instanceof HTMLTextAreaElement) {
        const target = focusTarget.value as HTMLInputElement | HTMLTextAreaElement

        const start = target.selectionStart ?? target.value.length
        const end = target.selectionEnd ?? target.value.length

        target.setRangeText(quickInput.value, start, end, 'end')

        const inputEvent = new Event('input', { bubbles: true })
        target.dispatchEvent(inputEvent)

        const changeEvent = new Event('change')
        target.dispatchEvent(changeEvent)
    }
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
