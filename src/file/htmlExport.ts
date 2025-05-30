import {writeFile} from "@tauri-apps/plugin-fs";
import {toJpeg, toPng, toSvg} from 'html-to-image';
import {downloadDir} from "@tauri-apps/api/path";
import {save} from "@tauri-apps/plugin-dialog";
import {sendMessage} from "@/message/sendMessage.ts";

export const ExportType_CONSTANT = ["SVG", "PNG", "JPG"]

export type ExportType = typeof ExportType_CONSTANT[number]

export const exportAsSvg = async (element: HTMLElement, name: string) => {
    const svg = await toSvg(element)
    return await downloadSvgFile(svg, {filename: name.endsWith(".svg") ? name : name + ".svg"})
}

export const exportAsPng = async (element: HTMLElement, name: string) => {
    const png = await toPng(element)
    return await downloadImageFile(png, {filename: name.endsWith(".png") ? name : name + ".png"})
}

export const exportAsJpg = async (element: HTMLElement, name: string) => {
    const jpg = await toJpeg(element)
    return await downloadImageFile(jpg, {filename: name.endsWith(".jpg") || name.endsWith(".jpeg") ? name : name + ".jpg"})
}

export const exportAs = async (element: HTMLElement, name: string, type: ExportType) => {
    switch (type) {
        case "PNG":
            return await exportAsPng(element, name)
        case "SVG":
            return await exportAsSvg(element, name)
        case "JPG":
            return await exportAsJpg(element, name)
    }
}

type DownloadOptions = {
    filename: string
}

/**
 * 基于浏览器下载 dataUrl 文件
 * @param dataUrl
 * @param filename
 */
const downloadFileUsingAnchor = (dataUrl: string, filename: string) => {
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

/**
 * 下载 Uint8Array 文件至本地，默认打开路径是 downloadDir
 * @param data 数据
 * @param filename 文件名
 */
const downloadFile = async (data: Uint8Array, filename: string) => {
    let path: string | null = await downloadDir() + "/" + filename

    path = await save({defaultPath: path})

    if (path === null) {
        sendMessage("path select canceled")
        return null
    }

    await writeFile(path, data)

    return path
}

export const downloadImageFile = async (dataUrl: string, options: DownloadOptions): Promise<string | null> => {
    const {filename} = options

    const base64Data = dataUrl.replace(/^data:image\/\w+;base64,/, '')
    const binaryString = atob(base64Data)
    const arrayBuffer = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
        arrayBuffer[i] = binaryString.charCodeAt(i);
    }
    const data = new Uint8Array(arrayBuffer)

    try {
        return downloadFile(data, filename)
    } catch {
        downloadFileUsingAnchor(dataUrl, filename)
        return "download path"
    }
}

const svgPrefix = 'data:image/svg+xml;charset=utf-8,';

const downloadSvgFile = async (dataUrl: string, options: DownloadOptions): Promise<string | null> => {
    const {filename} = options

    const encodedSvgContent = dataUrl.slice(svgPrefix.length);
    const decodedSvgContent = decodeURIComponent(encodedSvgContent);

    const encoder = new TextEncoder();
    const data = encoder.encode(decodedSvgContent);

    try {
        return downloadFile(data, filename)
    } catch {
        downloadFileUsingAnchor(dataUrl, filename)
        return "download path"
    }
}
