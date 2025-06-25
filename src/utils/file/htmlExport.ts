import {toJpeg, toPng, toSvg} from 'html-to-image';
import {downloadImageFile, downloadSvgFile} from "@/utils/file/fileSave.ts";

export const exportAsSvg = async (element: HTMLElement, filename: string) => {
    const svg = await toSvg(element, {pixelRatio: 2, height: element.offsetHeight, width: element.offsetWidth})
    return await downloadSvgFile(svg, {filename})
}

export const exportAsPng = async (element: HTMLElement, filename: string) => {
    const png = await toPng(element, {pixelRatio: 2, height: element.offsetHeight, width: element.offsetWidth})
    return await downloadImageFile(png, {filename, fileType: "png"})
}

export const exportAsJpg = async (element: HTMLElement, filename: string) => {
    const jpg = await toJpeg(element, {pixelRatio: 2, height: element.offsetHeight, width: element.offsetWidth})
    return await downloadImageFile(jpg, {filename, fileType: "jpg"})
}
