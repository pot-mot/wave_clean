import {writeFile} from "@tauri-apps/plugin-fs";
import {toPng, toJpeg, toSvg} from 'html-to-image';
import {downloadDir} from "@tauri-apps/api/path";

export const ExportType_CONSTANT = ["SVG", "PNG", "JPG"]

export type ExportType = typeof ExportType_CONSTANT[number]

export const exportAsSvg = async (element: HTMLElement, name: string) => {
    const svg = await toSvg(element)
    return await downloadSvgFile(svg, {filename: name.endsWith( ".svg") ? name : name + ".svg"})
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

const downloadFileUsingAnchor = (dataUrl: string, filename: string) => {
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

export const downloadImageFile = async (dataUrl: string, options: DownloadOptions) => {
    const {filename} = options

    try {
        const base64Data = dataUrl.replace(/^data:image\/\w+;base64,/, '')
        const binaryString = atob(base64Data)
        const arrayBuffer = new Uint8Array(binaryString.length)
        for (let i = 0; i < binaryString.length; i++) {
            arrayBuffer[i] = binaryString.charCodeAt(i);
        }

        const baseDir = await downloadDir()
        const path = baseDir + "/" + filename
        await writeFile(path,  new Uint8Array(arrayBuffer))

        return path
    } catch (e) {
        downloadFileUsingAnchor(dataUrl, filename)
        return "download path"
    }
}

const prefix = 'data:image/svg+xml;charset=utf-8,';

const downloadSvgFile = async (dataUrl: string, options: DownloadOptions) => {
    const {filename} = options

    try {
        const encodedSvgContent = dataUrl.slice(prefix.length);
        const decodedSvgContent = decodeURIComponent(encodedSvgContent);

        const encoder = new TextEncoder();
        const data = encoder.encode(decodedSvgContent);

        const baseDir = await downloadDir()
        const path = baseDir + "/" + filename
        await writeFile(path, data)

        return path
    } catch (e) {
         downloadFileUsingAnchor(dataUrl, filename)
        return "download path"
    }
}
