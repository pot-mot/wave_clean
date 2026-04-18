import {type MainLocale} from '@/i18n/index.ts';

export const localeZhCn: MainLocale = {
    copy: '复制',
    copy_success: '复制成功',
    copy_fail: '复制失败',
    paste: '粘贴',
    paste_success: '粘贴成功',
    paste_fail: '粘贴失败',
    cut: '剪切',
    cut_success: '剪切成功',
    cut_fail: '剪切失败',

    edit: '编辑',
    submit: '提交',
    delete: '删除',
    clear: '清理',
    save: '保存',
    cancel: '取消',
    load: '导入',
    export: '导出',
    test: '测试',
    merge_down: '向下合并',
    lock: '锁定',
    unlock: '解锁',
    confirm: '确认',

    undo_success: '撤销成功',
    cannot_undo: '无法撤销',
    redo_success: '重做成功',
    cannot_redo: '无法重做',

    delete_confirm_title: (target: string) => `${target}删除确认`,
    delete_confirm_content: (target: string) => `确定要删除${target}吗？`,

    mindMap: '脑图',
    untitled_mindMap: '[未命名脑图]',
    layer: '图层',
    quickInput: '快捷输入',

    place_set_name_warning: '请设置名称',
    get_mindMap_fail: '获取脑图失败',
    toggle_mindMap_fail: '切换失败',
    create_mindMap_success: '创建成功',
    create_mindMap_fail: '创建失败',
    save_mindMap_success: '保存成功',
    save_mindMap_fail: '保存失败',
    load_mindMap_success: '加载成功',
    load_mindMap_fail: '加载失败',
    export_mindMap_success: '导出成功',
    export_mindMap_fail: '导出失败',
    remove_mindMap_success: '删除成功',
    remove_mindMap_fail: '删除失败',

    save_confirm: '保存确认',
    save_confirm_content: (target: string) => `确定要保存 ${target} 吗？`,

    remove_success: '移除成功',

    path_select_cancel: '路径选择取消',

    primary_color: '主色',
    language: '语言',
    language_zh_cn: '中文',
    language_en: 'English',
    theme: '主题',

    layer_is_invisible: '当前图层不可见',
    layer_is_locked: '当前图层已锁定',

    mindMap_create_dialog_title: '创建新脑图',
    mindMap_title_placeholder: '新脑图名称',

    quickInput_dialog_title: '快捷输入配置',
    quickInput_label: '展示文本',
    quickInput_value: '快捷输入内容',

    MESSAGE_delete_confirm: (deleteTarget: string) => `确定要删除 ${deleteTarget} 吗？`,

    markdown_element_not_exist: 'Markdown 元素不存在',

    download_unsupported: '不支持下载',
    browser_download_path: '[浏览器下载路径]',
    download_success: (fileName: string, path: string) => `${fileName} 下载成功，保存在 ${path}`,
    download_fail: (fileName: string) => `${fileName} 下载失败`,
};
