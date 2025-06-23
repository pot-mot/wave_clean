const numberReg = /^\d+$/

export const formatDatetimeToLocal = (datetime: string | number | null | undefined) => {
    if (!datetime) return ""
    try {
        if (typeof datetime === "string" && numberReg.test(datetime)) {
            datetime = parseInt(datetime)
        }
        return new Date(datetime).toLocaleString()
    } catch (e) {
        return datetime
    }
}