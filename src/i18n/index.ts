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

    undo_success: string
    cannot_undo: string
    redo_success: string
    cannot_redo: string

    delete_confirm_title: (target: string) => string
    delete_confirm_content: (target: string) => string

    mindMap: string
    untitled_mindMap: string
    layer: string
    quickInput: string

    place_set_name_warning: string,
    get_mindMap_fail: string,
    toggle_mindMap_fail: string,
    create_mindMap_success: string,
    create_mindMap_fail: string,
    save_mindMap_success: string,
    save_mindMap_fail: string,
    load_mindMap_success: string,
    load_mindMap_fail: string,
    export_mindMap_success: string
    export_mindMap_fail: string
    remove_mindMap_success: string
    remove_mindMap_fail: string

    remove_success: string

    path_select_cancel: string

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
    [K: string]: string | ((...args: any[]) => string)
}

export type LocalKeyParam<
    Locale extends BaseLocale = MainLocale
> =
    {
        [K in keyof Locale]:
        Locale[K] extends (...args: any[]) => string
            ? { key: K, args: Parameters<Locale[K]> }
            : K
    }[keyof Locale]
