import {downloadDir} from "@tauri-apps/api/path";
import {save, SaveDialogOptions} from "@tauri-apps/plugin-dialog";
import {sendMessage} from "@/components/message/messageApi.ts";
import {writeFile} from "@tauri-apps/plugin-fs";
import {noTauriInvokeSubstitution} from "@/utils/error/noTauriInvokeSubstitution.ts";

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

const TEXT_PREFIX = 'data:text/plain;charset=utf-8,'

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

    return await noTauriInvokeSubstitution(
        async () => {
            return await downloadFileUsingTauriFile(data, filename)
        },
        () => {
            const dataUrl = `${TEXT_PREFIX}${encodeURIComponent(text)}`;
            downloadFileUsingAnchor(dataUrl, filename)
            return "download path"
        }
    )
}

export const IMAGE_BASE64_PREFIX = /^data:image\/(\w+);base64,/

export const downloadImageFile = async (
    dataUrl: string,
    options: {
        filename: string,
        fileType?: string,
    }
): Promise<string | null> => {
    let {filename, fileType} = options
    if (!fileType) {
        fileType = dataUrl.match(IMAGE_BASE64_PREFIX)?.[1]
    }
    if (!fileType) {
        throw new Error("fileType is required")
    }
    filename = ensureFileSuffix(filename, fileType)

    const base64Data = dataUrl.replace(IMAGE_BASE64_PREFIX, '')
    const binaryString = atob(base64Data)
    const arrayBuffer = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
        arrayBuffer[i] = binaryString.charCodeAt(i);
    }
    const data = new Uint8Array(arrayBuffer)

    return await noTauriInvokeSubstitution(
        async () => {
            return await downloadFileUsingTauriFile(data, filename)
        },
        () => {
            downloadFileUsingAnchor(dataUrl, filename)
            return "download path"
        }
    )
}

export const SVG_PREFIX_REGEX = /^data:image\/svg\+xml(?:;charset=([^,]+))?(;base64)?,/

export const downloadSvgFile = async (
    dataUrl: string,
    options: {
        filename: string
    }
): Promise<string | null> => {
    let {filename} = options
    filename = ensureFileSuffix(filename, "svg")

    return await noTauriInvokeSubstitution(
        async () => {
            // 提取字符集信息和内容
            const [, , base64] = dataUrl.match(SVG_PREFIX_REGEX) || []
            const svgContent = dataUrl.replace(SVG_PREFIX_REGEX, '')

            let data: Uint8Array

            if (base64) {
                const binaryString = atob(svgContent);
                data = new Uint8Array(binaryString.length)
                    .map((_, i) => binaryString.charCodeAt(i));
            } else {
                const decodedContent = decodeURIComponent(svgContent);
                data = encoder.encode(decodedContent);
            }

            return await downloadFileUsingTauriFile(data, filename)
        },
        () => {
            downloadFileUsingAnchor(dataUrl, filename)
            return "download path"
        }
    )
}