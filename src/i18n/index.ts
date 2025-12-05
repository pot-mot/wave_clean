export type MainLocale = {
    copy: string
    cut: string
    paste: string

    edit: string
    submit: string
    delete: string
    clear: string
    save: string
    cancel: string
    load: string
    export: string
    test: string
    merge_down: string
    lock: string
    unlock: string
    confirm: string

    delete_confirm_title: (target: string) => string
    delete_confirm_content: (target: string) => string

    mindMap: string
    untitled_mindMap: string
    layer: string
    quickInput: string

    load_mindMap_from_file: string,

    primary_color: string
    language: string
    language_zh_cn: string
    language_en: string
    theme: string

    layer_is_invisible: string
    layer_is_locked: string

    mindMap_title_placeholder: string

    quickInput_label: string
    quickInput_value: string

    MESSAGE_delete_confirm: (deleteTarget: string) => string
}

type BaseLocale = {
    [K : string]: string | ((...args: any[]) => string)
}

type LocaleKey<
    Locale extends BaseLocale = MainLocale
> =
    keyof Locale

type LocaleKeyWithArgs<
    Locale extends BaseLocale = MainLocale,
    K extends keyof Locale = keyof Locale,
    V extends Locale[K] = Locale[K]
> =
    { key: K, args: V extends (...args: infer A) => string ? A : [] }

export type LocalKeyParam<
    Locale extends BaseLocale = MainLocale
> =
    LocaleKey<Locale> | LocaleKeyWithArgs<Locale>

