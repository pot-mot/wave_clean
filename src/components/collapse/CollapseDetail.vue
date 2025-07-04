<template>
    <div class="collapse-detail-container">
        <div
            class="collapse-detail-head"
            :class="`caret-${triggerPosition} open-by-${openTrigger}`"
            @click="() => {
                if (openTrigger === 'head') isOpen = !isOpen
            }"
        >
            <div
                class="caret-wrapper"
                v-if="triggerPosition === 'left'"
                @click="() => {
                    if (openTrigger === 'caret') isOpen = !isOpen
                }"
            >
                <IconCaretDown
                    class="caret left"
                    :class="{ open: isOpen }"
                />
            </div>
            <div>
                <slot name="head"/>
            </div>
            <div
                class="caret-wrapper"
                v-if="triggerPosition === 'right'"
                @click="() => {
                    if (openTrigger === 'caret') isOpen = !isOpen
                }"
            >
                <IconCaretDown
                    class="caret right"
                    :class="{ open: isOpen }"
                />
            </div>
        </div>

        <div
            class="collapse-detail-body"
            ref="bodyRef"
        >
            <slot name="body"/>
        </div>
    </div>
</template>

<script setup lang="ts">
import {onMounted, useTemplateRef, watch} from 'vue'
import {CollapseProps, defaultCollapseProps} from "@/components/collapse/CollapseProps.ts";
import IconCaretDown from "@/components/icons/IconCaretDown.vue";

const isOpen = defineModel<boolean>({required: false, default: false})

const props = withDefaults(defineProps<CollapseProps>(), defaultCollapseProps)

const bodyRef = useTemplateRef("bodyRef")

onMounted(() => {
    if (bodyRef.value) {
        if (isOpen.value) {
            bodyRef.value.style.maxHeight = `${bodyRef.value.scrollHeight}px`
        } else {
            bodyRef.value.style.maxHeight = '0'
        }

        bodyRef.value.style.transition = `max-height ${props.transitionDuration}ms ease-out`
        bodyRef.value.style.overflow = 'hidden'
    }
})

watch(() => isOpen.value, () => {
    if (bodyRef.value) {
        if (isOpen.value) {
            bodyRef.value.style.maxHeight = `${bodyRef.value.scrollHeight}px`
        } else {
            bodyRef.value.style.maxHeight = '0'
        }
    }
})
</script>

<style scoped>
.collapse-detail-head {
    width: 100%;
}

.collapse-detail-head.open-by-head {
    cursor: pointer;
}

.collapse-detail-head.open-by-caret > .caret-wrapper {
    cursor: pointer;
}

.collapse-detail-head.caret-left {
    display: grid;
    grid-template-columns: 1rem calc(100% - 1rem);
}

.collapse-detail-head.caret-right {
    position: relative;
    display: grid;
    grid-template-columns: calc(100% - 1rem) 1rem;
}

.collapse-detail-head > .caret-wrapper > .caret {
    position: absolute;
    top: 50%;
    transition: transform v-bind(transitionDuration+ 'ms') ease;
}

.collapse-detail-head > .caret-wrapper > .caret.left {
    transform: translateY(-50%) rotate(-90deg);
}

.collapse-detail-head > .caret-wrapper > .caret.right {
    transform: translateY(-50%) rotate(90deg);
}

.collapse-detail-head > .caret-wrapper > .caret.open {
    transform: translateY(-50%) rotate(0);
}
</style>