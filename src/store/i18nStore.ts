import {computed, ref} from "vue";
import {localeZhCn} from "@/i18n/zhCn.ts"
import {localeEn} from '@/i18n/en.ts'
import {ProjectLocale, MainLocaleKeyParam, ProjectLocaleKeyParam} from "@/i18n";
import {sendMessage} from "@/components/message/sendMessage.ts";
import {createStore} from "@/store/createStore.ts";

const languageOptions = {
    'zh-cn': {
        main: localeZhCn,
    },
    'en': {
        main: localeEn,
    },
}

export type LanguageType = keyof typeof languageOptions

export const languageTypes = Object.keys(languageOptions) as LanguageType[]

export const useI18nStore = createStore(() => {
    const language = ref<LanguageType>('zh-cn')

    const mainLocale = computed<ProjectLocale>(() => {
        return languageOptions[language.value].main
    })

    return {
        language,
        mainLocale,
    }
})

export const translate = (keyParam: MainLocaleKeyParam | ProjectLocaleKeyParam): string => {
    const mainLocale = useI18nStore().mainLocale

    const isString = typeof keyParam === "string"

    if (isString && keyParam in mainLocale.value) {
        const translateItem = mainLocale.value[keyParam]

        if (typeof translateItem === "string") {
            return translateItem
        } else if (typeof translateItem === "function") {
            return (translateItem as any)()
        }
    } else if (typeof keyParam === "object") {
        const {key, args} = keyParam

        const translateItem = mainLocale.value[key]

        if (typeof translateItem === "string") {
            return translateItem
        } else if (typeof translateItem === "function") {
            return (translateItem as any)(...args)
        }

        sendMessage(`key ${key} args ${args} is not valid.`, {type: 'warning'})
        return key
    }

    sendMessage(`keyParam ${keyParam} cannot translate.`, {type: 'warning'})

    if (isString) {
        return keyParam
    } else {
        return `${keyParam}`
    }
}
