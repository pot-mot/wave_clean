import MarkdownIt from "markdown-it";
import {api as viewerApi} from "v-viewer"
import "viewerjs/dist/viewer.css";
import "@/utils/image/imageViewerDownloadIcon.css"
import {getMatchedElementOrParent} from "@/utils/event/judgeEventTarget.ts";
import {downloadImageFile, downloadSvgFile, IMAGE_BASE64_PREFIX, SVG_PREFIX_REGEX} from "@/utils/file/fileDownload.ts";
import {sendMessage} from "@/components/message/sendMessage.ts";
import {withLoading} from "@/components/loading/loadingApi.ts";

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

const handleImageDownload = async (e: Event) => {
    if (!(e.target instanceof HTMLElement)) return
    const viewerContainer = getMatchedElementOrParent(e.target, (el) => el.classList.contains("viewer-container"))
    if (!viewerContainer) return
    const image = viewerContainer.querySelector('.viewer-canvas > img')
    if (!image || !(image instanceof HTMLImageElement)) return

    await withLoading("Export MindMap", async () => {
        let path
        const filename = `image-${Date.now()}`
        if (SVG_PREFIX_REGEX.test(image.src)) {
            path = await downloadSvgFile(image.src, {filename})
        } else if (IMAGE_BASE64_PREFIX.test(image.src)) {
            path = await downloadImageFile(image.src, {filename})
        } else {
            sendMessage("Save Unsupported", {type: "warning"})
        }
        if (path) {
            sendMessage(`Save ${filename} Success\nAt ${path}`, {type: "success"})
        }
    })
}

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
            const svgString = serializer.serializeToString(images[i])
            // 将字符串编码为Base64格式
            const base64String = btoa(svgString)
            imageSrcList.push(`data:image/svg+xml;base64,${base64String}`)
        }

        if (!isMatchCurrent) {
            if (currentElement === images[i]) {
                isMatchCurrent = true
            } else {
                initialViewIndex++
            }
        }
    }

    viewerApi({
        images: imageSrcList,
        options: {
            initialViewIndex,
            zIndex: 5000000,
            title: false,
            toolbar: {
                play: false,
                reset: false,

                zoomIn: true,
                oneToOne: true,
                zoomOut: true,

                prev: images.length > 1,
                next: images.length > 1,

                flipHorizontal: true,
                flipVertical: true,
                rotateLeft: true,
                rotateRight: true,

                download: {
                    show: true,
                    click: handleImageDownload
                }
            }
        }
    })
}