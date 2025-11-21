import {type MainLocale} from "@/i18n/index.ts";

export const localeZhCn: MainLocale = {
    copy: "复制",
    cut: "剪切",
    paste: "粘贴",

    edit: "编辑",
    submit: "提交",
    delete: "删除",
    clear: "清理",
    save: "保存",
    cancel: "取消",
    load: "导入",
    export: "导出",
    test: "测试",
    merge_down: "向下合并",
    lock: "锁定",
    unlock: "解锁",

    primary_color: "颜色",
    language: "语言",
    language_zh_cn: "中文",
    language_en: "English",
    theme: "主题",

    layer_is_invisible: "当前图层不可见",

    MESSAGE_delete_confirm: (deleteTarget: string) => `确定要删除 ${deleteTarget} 吗？`
}
