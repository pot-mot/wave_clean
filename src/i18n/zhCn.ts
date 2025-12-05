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
    confirm: "确认",

    delete_confirm_title: (target: string) => `${target}删除确认`,
    delete_confirm_content: (target: string) => `确定要删除${target}吗？`,

    mindMap: "脑图",
    untitled_mindMap: "[未命名脑图]",
    layer: "图层",
    quickInput: "快捷输入",

    load_mindMap_from_file: "从文件导入",

    primary_color: "颜色",
    language: "语言",
    language_zh_cn: "中文",
    language_en: "English",
    theme: "主题",

    layer_is_invisible: "当前图层不可见",
    layer_is_locked: "当前图层已锁定",

    mindMap_title_placeholder: "新脑图名称",

    quickInput_label: "展示文本",
    quickInput_value: "快捷输入内容",

    MESSAGE_delete_confirm: (deleteTarget: string) => `确定要删除 ${deleteTarget} 吗？`
}
