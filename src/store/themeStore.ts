import {readonly, ref, watch} from "vue";
import {Theme, getCurrentWindow} from "@tauri-apps/api/window";
import {useDeviceStore} from "@/store/deviceStore.ts";
import {createStore} from "@/utils/store/createStore.ts";
import {tinycolor} from "vue-color";
import {setMermaidTheme} from "@/components/markdown/preview/plugins/MarkdownItMermaid.ts";
import {cleanMarkdownRenderCache} from "@/components/markdown/preview/markdownRender.ts";

const initTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
const theme = ref<Theme>(initTheme)

watch(() => theme.value, (newTheme) => {
    cleanMarkdownRenderCache()
    if (newTheme === 'dark') {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
    setMermaidTheme(newTheme)
}, {immediate: true})

const initPrimaryColor = window.getComputedStyle(document.documentElement).getPropertyValue("--primary-color").toLowerCase()
document.documentElement.style.setProperty("--primary-color-opacity-background", tinycolor(initPrimaryColor).setAlpha(0.1).toRgbString())

const primaryColor = ref<string>(initPrimaryColor)
watch(() => primaryColor.value, (newPrimaryColor) => {
    document.documentElement.style.setProperty("--primary-color", newPrimaryColor)
    document.documentElement.style.setProperty("--primary-color-opacity-background", tinycolor(newPrimaryColor).setAlpha(0.1).toRgbString())
})

export const initThemeStore = async () => {
    const {isTouchDevice} = useDeviceStore()

    try {
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
    };
})