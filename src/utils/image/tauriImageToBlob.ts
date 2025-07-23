import {Image} from "@tauri-apps/api/image";

export const tauriImageToBlob = async (image: Image): Promise<Blob | undefined> => {
    const size = await image.size()
    const rgba = await image.rgba()
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const imageData = ctx.createImageData(size.width, size.height)
    imageData.data.set(rgba)
    ctx.putImageData(imageData, 0, 0)

    return await new Promise((resolve) => {
        canvas.toBlob((blob) => {
            if (!blob) return
            resolve(blob)
        })
    })
}