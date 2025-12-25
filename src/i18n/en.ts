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

    place_set_name_warning: "Please set name",
    get_mindMap_fail: "Get MindMap Fail",
    toggle_mindMap_fail: "Toggle MindMap Fail",
    create_mindMap_success: "Create MindMap Success",
    create_mindMap_fail: "Create MindMap Fail",
    save_mindMap_success: "Save MindMap Success",
    save_mindMap_fail: "Save MindMap Fail",
    load_mindMap_success: "Load MindMap Success",
    load_mindMap_fail: "Load MindMap Fail",
    export_mindMap_success: "Export MindMap Success",
    export_mindMap_fail: "Export MindMap Fail",
    remove_mindMap_fail: "Remove MindMap Fail",
    remove_mindMap_success: "Remove MindMap Success",

    remove_success: "删除成功",

    path_select_cancel: "Path Select Canceled",

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
