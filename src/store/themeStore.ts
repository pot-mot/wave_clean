import {readonly, ref, watch} from "vue";
import {type Theme, getCurrentWindow} from "@tauri-apps/api/window";
import {useDeviceStore} from "@/store/deviceStore.ts";
import {createStore} from "@/utils/store/createStore.ts";
import {tinycolor} from "vue-color";
import {setMermaidTheme} from "@/components/markdown/preview/plugins/MarkdownItMermaid.ts";
import {cleanMarkdownRenderCache} from "@/components/markdown/preview/markdownRender.ts";

const theme = ref<Theme>('light')

watch(() => theme.value, (newTheme) => {
    cleanMarkdownRenderCache()
    if (newTheme === 'dark') {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
    setMermaidTheme(newTheme)
}, {immediate: true})

const defaultPrimaryColor = '#1E90FF'
const primaryColor = ref<string>(defaultPrimaryColor)
watch(() => primaryColor.value, (newPrimaryColor) => {
    document.documentElement.style.setProperty("--primary-color", newPrimaryColor)
    document.documentElement.style.setProperty("--primary-color-opacity-background", tinycolor(newPrimaryColor).setAlpha(0.1).toRgbString())
})

export const initThemeStore = async () => {
    try {
        const {isTouchDevice} = useDeviceStore()

        const initTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        theme.value = initTheme

        const initPrimaryColor = window.getComputedStyle(document.documentElement).getPropertyValue("--primary-color").toLowerCase()
        if (initPrimaryColor) {
            primaryColor.value = initPrimaryColor
        }

        if (!isTouchDevice.value) {
            // setup window theme
            const currentWindow = getCurrentWindow()
            const currentTheme = await currentWindow.theme()

            if (currentTheme && currentTheme !== initTheme) {
                theme.value = currentTheme
            }
        }
    } catch (e) {}
}

export const useThemeStore = createStore(() => {
    return {
        theme: readonly(theme),
        setTheme: (newTheme: Theme) => {
            theme.value = newTheme
        },
        toggleTheme: () => {
            theme.value = theme.value === 'dark' ? 'light' : 'dark';
        },

        primaryColor: readonly(primaryColor),
        setPrimaryColor: (newPrimaryColor: string) => {
            primaryColor.value = newPrimaryColor
        },
        resetPrimaryColor: () => {
            primaryColor.value = defaultPrimaryColor
        },
    };
})