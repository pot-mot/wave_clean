import {readonly, ref, watch} from "vue";
import {Theme, getCurrentWindow} from "@tauri-apps/api/window";
import {useDeviceStore} from "@/store/deviceStore.ts";
import {createStore} from "@/utils/store/createStore.ts";
import {tinycolor} from "vue-color";
import {setMermaidTheme} from "@/components/markdown/preview/plugins/MarkdownItMermaid.ts";
import {cleanMarkdownRenderCache} from "@/components/markdown/preview/markdownRender.ts";

export const useThemeStore = createStore(() => {
    const {isTouchDevice} = useDeviceStore()

    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    const theme = ref<Theme>(systemTheme)
    ;(async () => {
        try {
            if (!isTouchDevice.value) {
                const currentWindow = getCurrentWindow()
                const currentTheme = await currentWindow.theme()

                if (currentTheme && currentTheme !== systemTheme) {
                    theme.value = currentTheme
                }
            }
        } catch (e) {}
    })()


    watch(() => theme.value, (newTheme) => {
        cleanMarkdownRenderCache()
        if (newTheme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        setMermaidTheme(newTheme)
    }, {immediate: true})

    const setTheme = (newTheme: Theme) => {
        theme.value = newTheme
    }

    const toggleTheme = () => {
        theme.value = theme.value === 'dark' ? 'light' : 'dark';
    }

    const initPrimaryColor = window.getComputedStyle(document.documentElement).getPropertyValue("--primary-color").toLowerCase()
    document.documentElement.style.setProperty("--primary-color-opacity-background", tinycolor(initPrimaryColor).setAlpha(0.1).toRgbString())
    const primaryColor = ref<string>(initPrimaryColor)

    watch(() => primaryColor.value, (newPrimaryColor) => {
        document.documentElement.style.setProperty("--primary-color", newPrimaryColor)
        document.documentElement.style.setProperty("--primary-color-opacity-background", tinycolor(newPrimaryColor).setAlpha(0.1).toRgbString())
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
})