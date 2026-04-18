<script setup lang="ts">
import {useThemeStore} from '@/store/themeStore.ts';
import IconDark from '@/components/icons/IconDark.vue';
import IconLight from '@/components/icons/IconLight.vue';
import {computed} from 'vue';
import ColorInput from '@/components/color/ColorInput.vue';
import {type LanguageType, translate, useI18nStore} from '@/store/i18nStore.ts';

const themeStore = useThemeStore();

const {language, setLanguage} = useI18nStore();

const primaryColor = computed({
    get(): string {
        return themeStore.primaryColor.value;
    },
    set(color: string) {
        themeStore.setPrimaryColor(color);
    },
});
</script>

<template>
    <div class="config-menu">
        <div class="config-item">
            <div>{{ translate('primary_color') }}</div>
            <ColorInput v-model="primaryColor" />
        </div>

        <div class="config-item">
            <div>{{ translate('language') }}</div>
            <select
                class="language-select"
                :value="language"
                @change="
                    (e: Event) => setLanguage((e.target as HTMLSelectElement).value as LanguageType)
                "
            >
                <option value="zh-cn">{{ translate('language_zh_cn') }}</option>
                <option value="en">{{ translate('language_en') }}</option>
            </select>
        </div>

        <div class="config-item">
            <div>{{ translate('theme') }}</div>
            <button
                class="theme-button"
                @click="themeStore.toggleTheme()"
            >
                <IconLight v-if="themeStore.theme.value === 'light'" />
                <IconDark v-else-if="themeStore.theme.value === 'dark'" />
            </button>
        </div>
    </div>
</template>

<style scoped>
.config-menu {
    width: 100%;
    display: flex;
    justify-content: space-around;
    height: 2rem;
    line-height: 2rem;
    overflow-x: auto;
    overflow-y: hidden;
    gap: 1rem;
}

.config-item {
    display: flex;
    align-items: center;
    gap: 0.25rem;
}

.language-select {
    border-radius: 0.25rem;
}

.theme-button {
    border: none;
    border-radius: 0.25rem;
}
</style>
