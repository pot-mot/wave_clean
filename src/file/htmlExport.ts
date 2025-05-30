import {toPng, toSvg} from 'html-to-image';

export const exportAsPng = async (element: HTMLElement) => {
    const png = await toPng(element)
    downloadFile(png, 'export.png');
}

export const exportAsSvg = async (element: HTMLElement) => {
    const svg = await toSvg(element)
    downloadFile(svg, 'export.svg');
}

const downloadFile = (dataUrl: string, filename: string) => {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
