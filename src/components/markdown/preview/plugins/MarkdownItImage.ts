import MarkdownIt from "markdown-it";
import {api as viewerApi} from "v-viewer"
import "viewerjs/dist/viewer.css";

export const MarkdownItImage = (md: MarkdownIt) => {
    // @ts-ignore
    const defaultRender = (tokens, idx, options, env, self) => {
        return self.renderToken(tokens, idx, options)
    }

    md.renderer.rules.image = (tokens, idx, options, env, self) => {
        // 添加 target="_blank" 属性
        tokens[idx].attrPush(['target', '_blank'])
        tokens[idx].attrPush(["onload", "this.classList.remove('error');"])
        tokens[idx].attrPush(["onerror", "this.classList.add('error');"])
        // 调用默认渲染器以实现默认行为
        return defaultRender(tokens, idx, options, env, self)
    }
}

const serializer = new XMLSerializer()

export const imagePreview = (currentElement: Element, previewElement: HTMLElement) => {
    const images = previewElement.querySelectorAll('img, svg')
    const imageSrcList: string[] = []

    // 初始图片下标
    let initialViewIndex = 0
    // 是否为当前元素
    let isMatchCurrent = false

    for (let i = 0; i < images.length; i++) {
        if (images[i] instanceof HTMLImageElement && !images[i].classList.contains('error')) {
            imageSrcList.push((<HTMLImageElement>images[i]).src)
        } else if (images[i] instanceof SVGSVGElement) {
            const clone = <SVGSVGElement>images[i].cloneNode(true);
            const svgString = serializer.serializeToString(clone)
            // 将字符串编码为Base64格式
            const base64String = btoa(svgString)
            imageSrcList.push(`data:image/svg+xml;base64,${base64String}`)
            clone.remove()
        }

        if (!isMatchCurrent) {
            if (currentElement === images[i]) {
                isMatchCurrent = true
            } else {
                initialViewIndex ++
            }
        }
    }

    const zIndex = window
        .getComputedStyle(document.documentElement)
        .getPropertyValue('--image-viewer-z-index')

    viewerApi({images: imageSrcList, options: {initialViewIndex, zIndex: parseInt(zIndex)}})
}