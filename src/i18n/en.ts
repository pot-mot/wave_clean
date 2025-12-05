import {type MainLocale} from "@/i18n/index.ts";

export const localeEn: MainLocale = {
    copy: "Copy",
    cut: "Cut",
    paste: "Paste",

    edit: "Edit",
    submit: "Submit",
    delete: "Delete",
    clear: "Clear",
    save: "Save",
    cancel: "Cancel",
    load: "Load",
    export: "Export",
    test: "Test",
    merge_down: "Merge Down",
    lock: "Lock",
    unlock: "Unlock",
    confirm: "Confirm",

    delete_confirm_title: (target: string) => `${target} Delete Confirm`,
    delete_confirm_content: (target: string) => `Are you sure to delete ${target}?`,

    mindMap: "MindMap",
    untitled_mindMap: "[Untitled MindMap]",
    layer: "Layer",
    quickInput: "QuickInput",

    load_mindMap_from_file: "Load From File",

    primary_color: "color",
    language: "lang",
    language_zh_cn: "中文",
    language_en: "English",
    theme: "theme",

    layer_is_invisible: "Current Layer is Invisible",
    layer_is_locked: "Current Layer is Locked",

    mindMap_title_placeholder: "New MindMap Title",

    quickInput_label: "label",
    quickInput_value: "value",

    MESSAGE_delete_confirm: (deleteTarget: string) => `Are you sure to delete ${deleteTarget}?`
}
