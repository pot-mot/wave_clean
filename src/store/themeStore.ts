import {readonly, ref, watch} from "vue";
import {Theme, getCurrentWindow} from "@tauri-apps/api/window";

const initThemeStore = () => {
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    const theme = ref<Theme>(systemTheme)
    try {
        getCurrentWindow().theme().then(it => {
            if (it !== null) {
                theme.value = it
            }
        })
    } catch (e) {}

    watch(() => theme.value, (newTheme) => {
        if (newTheme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, {immediate: true})

    const setTheme = (newTheme: Theme) => {
        theme.value = newTheme
    }

    const toggleTheme = () => {
        theme.value = theme.value === 'dark' ? 'light' : 'dark';
    }

    const currentPrimaryColor = window.getComputedStyle(document.documentElement).getPropertyValue("--primary-color").toLowerCase()
    const primaryColor = ref<string>(currentPrimaryColor)

    watch(() => primaryColor.value, (newPrimaryColor) => {
        document.documentElement.style.setProperty("--primary-color", newPrimaryColor)
    })

    const setPrimaryColor = (newPrimaryColor: string) => {
        primaryColor.value = newPrimaryColor
    }

    return {
        theme: readonly(theme),
        setTheme,
        toggleTheme,

        primaryColor: readonly(primaryColor),
        setPrimaryColor,
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