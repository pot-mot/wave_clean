import {downloadDir} from "@tauri-apps/api/path";
import {save, SaveDialogOptions} from "@tauri-apps/plugin-dialog";
import {sendMessage} from "@/message/sendMessage.ts";
import {writeFile} from "@tauri-apps/plugin-fs";

const encoder = new TextEncoder()

/**
 * 基于浏览器下载 dataUrl 文件
 * @param dataUrl
 * @param filename
 */
export const downloadFileUsingAnchor = (dataUrl: string, filename: string) => {
    const a = document.createElement('a')
    a.href = dataUrl
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
}

/**
 * 下载 Uint8Array 文件至本地，默认打开路径是 downloadDir
 * @param data 数据
 * @param filename 文件名
 * @param saveOptions 保存文件选项
 */
export const downloadFileUsingTauriFile = async (
    data: Uint8Array,
    filename: string,
    saveOptions?: SaveDialogOptions
) => {
    let path: string | null = await downloadDir() + "/" + filename

    path = await save({
        defaultPath: path,
        ...saveOptions,
    })

    if (path === null) {
        sendMessage("path select canceled")
        return null
    }

    await writeFile(path, data)

    return path
}

export const ensureFileSuffix = (
    currentFileName: string,
    suffix: string
): string => {
    return currentFileName.endsWith("." + suffix)
        ? currentFileName
        : currentFileName + "." + suffix
}

export const downloadTextFile = async (
    text: string,
    options: {
        filename: string,
        fileType: string,
    }
): Promise<string | null> => {
    let {filename} = options
    filename = ensureFileSuffix(filename, options.fileType)

    const data = encoder.encode(text)

    try {
        return await downloadFileUsingTauriFile(data, filename)
    } catch (e) {
        const dataUrl = `data:text/plain;charset=utf-8,${encodeURIComponent(text)}`;
        downloadFileUsingAnchor(dataUrl, filename)
        return "download path"
    }
}

export const downloadImageFile = async (
    dataUrl: string,
    options: {
        filename: string,
        fileType: string,
    }
): Promise<string | null> => {
    let {filename} = options
    filename = ensureFileSuffix(filename, options.fileType)

    const base64Data = dataUrl.replace(/^data:image\/\w+;base64,/, '')
    const binaryString = atob(base64Data)
    const arrayBuffer = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
        arrayBuffer[i] = binaryString.charCodeAt(i);
    }
    const data = new Uint8Array(arrayBuffer)

    try {
        return await downloadFileUsingTauriFile(data, filename)
    } catch (e) {
        downloadFileUsingAnchor(dataUrl, filename)
        return "download path"
    }
}

const svgPrefix = 'data:image/svg+xml;charset=utf-8,';

export const downloadSvgFile = async (
    dataUrl: string,
    options: {
        filename: string
    }
): Promise<string | null> => {
    let {filename} = options
    filename = ensureFileSuffix(filename, "svg")

    const encodedSvgContent = dataUrl.slice(svgPrefix.length);
    const decodedSvgContent = decodeURIComponent(encodedSvgContent);

    const data = encoder.encode(decodedSvgContent);

    try {
        return await downloadFileUsingTauriFile(data, filename)
    } catch (e) {
        downloadFileUsingAnchor(dataUrl, filename)
        return "download path"
    }
}