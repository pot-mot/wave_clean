<script setup lang="ts" generic="T extends unknown = unknown">
import {computed, nextTick, onBeforeUnmount, ref, useTemplateRef, watch} from 'vue';
import IconCaretDown from '@/components/icons/IconCaretDown.vue';
import type {CustomSelectOption} from '@/components/select/createOptions.ts';

const props = withDefaults(
    defineProps<{
        options: readonly CustomSelectOption<T>[];
        multiple?: boolean;
        placeholder?: string;
        disabled?: boolean;
        selectAllLabel?: string;
    }>(),
    {
        multiple: false,
        disabled: false,
    },
);

const modelValue = defineModel<T | T[]>();

const open = ref(false);
const triggerRef = useTemplateRef<HTMLElement>('triggerRef');
const dropdownRef = useTemplateRef<HTMLElement>('dropdownRef');
const dropdownStyle = ref<Record<string, string>>({});

const toggle = () => {
    if (props.disabled) return;
    open.value = !open.value;
};

const close = () => {
    open.value = false;
};

const isSelected = (option: CustomSelectOption<T>): boolean => {
    const val = modelValue.value;
    if (val === undefined) return false;
    if (props.multiple) {
        return (val as T[]).some((v) => v === option.value);
    }
    return val === option.value;
};

const selectedOptions = computed(() => props.options.filter((o) => isSelected(o)));

const triggerLabel = computed(() => {
    if (props.multiple) {
        const count = selectedOptions.value.length;
        if (count === 0) return props.placeholder ?? '';
        if (count === props.options.length) return props.selectAllLabel ?? `${count}`;
        return `${count}`;
    }
    return selectedOptions.value[0]?.label ?? props.placeholder ?? '';
});

const isAllSelected = computed(() => {
    if (!props.multiple || props.options.length === 0) return false;
    const activeOptions = props.options.filter((o) => !o.disabled);
    if (activeOptions.length === 0) return false;
    return activeOptions.every((o) => isSelected(o));
});

const toggleAll = () => {
    if (!props.multiple) return;
    if (isAllSelected.value) {
        modelValue.value = [] as T[];
    } else {
        modelValue.value = props.options.filter((o) => !o.disabled).map((o) => o.value) as T[];
    }
};

const toggleOption = (option: CustomSelectOption<T>) => {
    if (props.disabled || option.disabled) return;
    if (props.multiple) {
        const current = [...((modelValue.value as T[] | undefined) ?? [])];
        const index = current.findIndex((v) => v === option.value);
        if (index >= 0) {
            current.splice(index, 1);
        } else {
            current.push(option.value);
        }
        modelValue.value = current as T[];
    } else {
        modelValue.value = option.value as T;
        close();
    }
};

const updateDropdownPosition = () => {
    if (!triggerRef.value) return;

    const rect = triggerRef.value.getBoundingClientRect();
    const viewportHeight = window.visualViewport?.height ?? window.innerHeight;
    const maxDropdownHeight = Math.min(300, viewportHeight * 0.5);
    const spaceBelow = viewportHeight - rect.bottom;
    const spaceAbove = rect.top;

    dropdownStyle.value = {
        minWidth: `${rect.width}px`,
        left: `${rect.left}px`,
        maxHeight: `${maxDropdownHeight}px`,
    };

    if (spaceBelow < maxDropdownHeight && spaceAbove > spaceBelow) {
        dropdownStyle.value.top = `${rect.top - 4}px`;
        dropdownStyle.value.transform = 'translateY(-100%)';
    } else {
        dropdownStyle.value.top = `${rect.bottom + 4}px`;
    }
};

const handleTriggerKeydown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggle();
    } else if (e.key === 'Escape') {
        close();
    }
};

const handleClickOutside = (e: MouseEvent) => {
    const target = e.target as Node;
    if (!triggerRef.value?.contains(target) && !dropdownRef.value?.contains(target)) {
        close();
    }
};

const handleDocumentEscape = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
        close();
        triggerRef.value?.focus();
    }
};

watch(open, async (val) => {
    if (val) {
        await nextTick();
        updateDropdownPosition();
        document.addEventListener('click', handleClickOutside, {capture: true});
        document.addEventListener('keydown', handleDocumentEscape, {capture: true});
    } else {
        document.removeEventListener('click', handleClickOutside, {capture: true});
        document.removeEventListener('keydown', handleDocumentEscape, {capture: true});
    }
});

onBeforeUnmount(() => {
    document.removeEventListener('click', handleClickOutside, {capture: true});
    document.removeEventListener('keydown', handleDocumentEscape, {capture: true});
});
</script>

<template>
    <div
        class="custom-select"
        :class="{open, disabled: props.disabled}"
    >
        <button
            ref="triggerRef"
            class="custom-select-trigger"
            type="button"
            :disabled="props.disabled"
            @click="toggle"
            @keydown="handleTriggerKeydown"
        >
            <slot
                name="trigger"
                :selected-options="selectedOptions"
            >
                <span class="trigger-label">{{ triggerLabel }}</span>
            </slot>
            <IconCaretDown
                class="caret"
                :class="{open}"
            />
        </button>

        <Teleport to="body">
            <div
                v-if="open"
                ref="dropdownRef"
                class="custom-select-dropdown"
                :style="dropdownStyle"
            >
                <div
                    v-if="props.multiple && props.selectAllLabel"
                    class="custom-select-option select-all"
                    @click.stop="toggleAll"
                >
                    <input
                        type="checkbox"
                        :checked="isAllSelected"
                        tabindex="-1"
                    />
                    <span>{{ props.selectAllLabel }}</span>
                </div>

                <div
                    v-for="option in props.options"
                    :key="option.id"
                    class="custom-select-option"
                    :class="{selected: isSelected(option), disabled: option.disabled}"
                    @click.stop="toggleOption(option)"
                >
                    <input
                        v-if="props.multiple"
                        type="checkbox"
                        :checked="isSelected(option)"
                        :disabled="option.disabled"
                        tabindex="-1"
                    />
                    <span>{{ option.label }}</span>
                </div>
            </div>
        </Teleport>
    </div>
</template>

<style scoped>
.custom-select {
    position: relative;
    display: flex;
    align-items: center;
    min-width: 0;
}

.custom-select-trigger {
    display: grid;
    grid-template-columns: 1fr auto;
    align-items: center;
    gap: 0.25rem;
    min-width: 0;
    max-width: 100%;
    height: 1.6rem;
    line-height: 1.6rem;
    border: var(--border);
    border-color: var(--background-color-hover);
    border-radius: var(--border-radius);
    background-color: var(--background-color);
    padding: 0 0.5rem;
    cursor: pointer;
    font-size: inherit;
    color: inherit;
}

.custom-select-trigger > :first-child {
    min-width: 0;
    overflow-x: auto;
    white-space: nowrap;
}

.custom-select-trigger:hover {
    background-color: var(--background-color-hover);
}

.custom-select-trigger:disabled,
.custom-select.disabled .custom-select-trigger {
    cursor: not-allowed;
    opacity: 0.5;
}

.trigger-label {
    user-select: none;
}

.caret {
    flex-shrink: 0;
    transition: transform 0.2s ease;
}

.caret.open {
    transform: rotate(180deg);
}

.custom-select-dropdown {
    position: fixed;
    z-index: var(--custom-select-z-index, 4000000);
    background-color: var(--background-color);
    border: var(--border);
    border-color: var(--background-color-hover);
    border-radius: var(--border-radius);
    overflow-y: auto;
    min-width: 8rem;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.custom-select-option {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.4rem 0.75rem;
    cursor: pointer;
    user-select: none;
    transition: background-color 0.2s ease;
}

.custom-select-option:hover:not(.disabled) {
    background-color: var(--background-color-hover);
}

.custom-select-option.selected {
    color: var(--primary-color);
}

.custom-select-option.disabled {
    cursor: not-allowed;
    opacity: 0.4;
}

.custom-select-option.select-all {
    border-bottom: var(--border);
    border-color: var(--background-color-hover);
    font-weight: bold;
}

.custom-select-option input[type='checkbox'] {
    cursor: inherit;
    flex-shrink: 0;
}
</style>
