export const blobToDataURL = (
    blob: Blob
): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => {
            if (reader.result === null) {
                reject(new Error('blobToDataURL: reader.result is null'))
                return
            }
            if (typeof reader.result !== 'string') {
                reject(new Error('blobToDataURL: reader.result is not string'))
                return
            }
            if (!reader.result.startsWith('data:')) {
                reject(new Error('blobToDataURL: reader.result does not start with "data:"'))
                return
            }
            resolve(reader.result)
        }
        reader.onerror = () => reject(reader.error)
        reader.readAsDataURL(blob)
    })
}