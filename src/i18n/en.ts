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

    MESSAGE_delete_confirm: (deleteTarget: string) => `Are you sure to delete ${deleteTarget}?`
}
