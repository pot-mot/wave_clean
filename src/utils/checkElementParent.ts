export const checkElementParent = (el: Element | null, parent: Element) => {
    while (el) {
        if (el === parent) {
            return true
        }
        el = el.parentElement!
    }
    return false
}
