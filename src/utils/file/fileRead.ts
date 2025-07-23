import {open, OpenDialogOptions} from '@tauri-apps/plugin-dialog'
import {readFile} from '@tauri-apps/plugin-fs'
import {getMimeType} from "html-to-image/es/mimes";

/**
 * 通过浏览器 input 元素选择文件（Web 环境）
 * @param accept 文件类型过滤（如 '.txt,.json'）
 * @returns
 */
export const readFileUsingInput = (accept = '*/*'): Promise<FileList | null> => {
    return new Promise((resolve) => {
        const input = document.createElement('input')
        input.type = 'file'
        input.accept = accept
        input.style.display = 'none'

        input.addEventListener('change', async () => {
            if (!input.files?.length) return resolve(null)
            resolve(input.files)
        })

        document.body.appendChild(input)
        input.click()
        document.body.removeChild(input)
    })
}

export const extractFileName = (path: string): string => {
    return path.split(/[\\/]/).pop() || 'unknown';
}

/**
 * 通过 Tauri 原生对话框选择文件（桌面端环境）
 * @param options 文件选择配置
 * @returns
 */
export const readFileUsingTauri = async (options?: Omit<OpenDialogOptions, 'multiple' | 'directory'>): Promise<FileList | null> => {
    const filePaths = await open({
        multiple: true,
        directory: false,
        ...options
    })

    if (!filePaths) return null

    const dataTransfer = new DataTransfer()
    const files = await Promise.all(filePaths.map(async (filePath) => {
        const data = await readFile(filePath)
        const fileName = extractFileName(filePath)
        const blob = new Blob([data])
        return new File([blob], fileName, {type: getMimeType(fileName)})
    }))

    for (const file of files) {
        dataTransfer.items.add(file)
    }

    return dataTransfer.files
}
