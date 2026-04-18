<script setup lang="ts">
import IconClose from '@/components/icons/IconClose.vue';
import type {DialogProps} from '@/components/dialog/DialogType.ts';

const props = defineProps<DialogProps>();

const handleClose = () => {
    props.onClose();
};
</script>

<template>
    <teleport to="body">
        <div class="dialog-mask">
            <div class="dialog-container">
                <div class="dialog-header">
                    <div class="dialog-title">{{ props.title }}</div>
                    <button
                        @click="handleClose"
                        class="close-button"
                    >
                        <IconClose />
                    </button>
                </div>
                <div class="dialog-content">
                    <slot />
                </div>
            </div>
        </div>
    </teleport>
</template>

<style scoped>
.dialog-mask {
    position: fixed;
    top: 0;
    left: 0;
    z-index: var(--mask-z-index);
    background-color: var(--mask-color);
    width: 100%;
    height: 100%;
}

.dialog-container {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: fit-content;
    height: fit-content;
    border: var(--border);
    border-color: var(--border-color-light);
    border-radius: var(--border-radius);
    background: var(--background-color);
    overflow: hidden;
}

.dialog-header {
    display: flex;
    gap: 0.5rem;
    justify-content: space-between;
}

.dialog-title {
    padding: 0.5rem;
    font-weight: 600;
}

.dialog-content {
    padding: 0 1rem;
    width: fit-content;
    height: fit-content;
    overflow: auto;
}

.close-button {
    border: none;
    padding: 0.5rem;
    height: 2rem;
    line-height: 1rem;
    cursor: pointer;
}

.close-button:hover {
    background-color: var(--danger-color);
    --icon-color: #fff;
}
</style>
