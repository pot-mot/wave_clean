const interactionTagNames = ["INPUT", "TEXTAREA", "BUTTON"]

export const interactionTagClassList = ["monaco-editor", "code-preview", "splitpanes__splitter"]

export const containsClassList = (e: HTMLElement, classNames: string[]) => {
    for (let className of classNames) {
        if (e.classList.contains(className)) {
            return true
        }
    }
    return false
}

export const judgeTarget = (
    e: UIEvent,
    judge: (el: HTMLElement) => boolean | undefined
) => {
    let target = (e.target as HTMLElement | undefined | null)

    while (target) {
        const result = judge(target)
        if (result) return result
        target = target.parentElement
    }
    return false
}

/**
 * 判断元素是否是一个交互用元素
 * @param e
 */
export const judgeTargetIsInteraction = (
    e: UIEvent
) => {
    return judgeTarget(e, (el) => {
        if ('contenteditable' in el) {
            return true
        }
        if (interactionTagNames.includes(el.tagName)) {
            return true
        }
        if (containsClassList(el, interactionTagClassList)) {
            return true
        }
    })
}

export const checkElementParent = (el: Element | null, parent: Element) => {
    while (el) {
        if (el === parent) {
            return true
        }
        el = el.parentElement
    }
    return false
}

export const getMatchedElementOrParent = (el: Element | null, match: (el: Element) => boolean) => {
    while (el) {
        if (match(el)) {
            return el
        }
        el = el.parentElement
    }
    return null
}

export const blurActiveElement = () => {
    if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur()
    }
}
