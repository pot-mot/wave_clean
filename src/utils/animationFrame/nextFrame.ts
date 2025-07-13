export const nextFrame = async () => {
    return await new Promise<void>((resolve) => {
        requestAnimationFrame(() => {
            resolve(void 0)
        })
    })
}