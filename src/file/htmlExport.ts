import {toJpeg, toPng, toSvg} from 'html-to-image';
import {downloadImageFile, downloadSvgFile} from "@/file/fileSave.ts";

export const exportAsSvg = async (element: HTMLElement, filename: string) => {
    const svg = await toSvg(element)
    return await downloadSvgFile(svg, {filename})
}

export const exportAsPng = async (element: HTMLElement, filename: string) => {
    const png = await toPng(element)
    return await downloadImageFile(png, {filename, fileType: "png"})
}

export const exportAsJpg = async (element: HTMLElement, filename: string) => {
    const jpg = await toJpeg(element)
    return await downloadImageFile(jpg, {filename, fileType: "jpg"})
}
