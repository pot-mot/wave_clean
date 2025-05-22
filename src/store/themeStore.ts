import {readonly, ref, watch} from "vue";

type Theme = 'light' | 'dark'

const initThemeStore = () => {
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    const theme = ref<Theme>(systemTheme);

    // 切换主题色
    const toggleTheme = () => {
        theme.value = theme.value === 'dark' ? 'light' : 'dark';
    };

    watch(() => theme.value, (newTheme) => {
        if (newTheme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, {immediate: true})

    return {
        theme: readonly(theme),
        toggleTheme,
    };
}

type ThemeStore = ReturnType<typeof initThemeStore>

let themeStore: ThemeStore | undefined

export const useThemeStore = (): ThemeStore => {
    if (themeStore === undefined) {
        themeStore = initThemeStore()
    }
    return themeStore
}