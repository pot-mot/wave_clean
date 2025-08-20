// Thanks for https://github.com/Hydralerne/axios-code/blob/main/touch/main.js

import {editor, Position, Selection} from "monaco-editor/esm/vs/editor/editor.api.js"
import {copyText, readClipBoardImageBlob, readClipBoardText} from "@/utils/clipBoard/useClipBoard.ts"
import IStandaloneCodeEditor = editor.IStandaloneCodeEditor;
import EditorOption = editor.EditorOption;
import ScrollType = editor.ScrollType;
import {blobToFile} from "@/utils/file/fileRead.ts";
import {sendMessage} from "@/components/message/sendMessage.ts";

type Selector = HTMLDivElement & {
    bottomCursor: HTMLDivElement,
    textCursor: HTMLDivElement,
}

const updateSelectionStart = (selection: Selection, position: Position): Selection => {
    return new Selection(
        position.lineNumber,
        position.column,
        selection.endLineNumber,
        selection.endColumn
    )
}

const updateSelectionEnd = (selection: Selection, position: Position): Selection => {
    return new Selection(
        selection.startLineNumber,
        selection.startColumn,
        position.lineNumber,
        position.column
    )
}

// 当触点移动到上下边缘时，尝试垂直滚动
const scrollTopExtremityFit = (editor: IStandaloneCodeEditor, touch: Touch, lineHeight: number) => {
    const scrollTop = editor.getScrollTop()

    const scrollHeight = editor.getScrollHeight()
    const viewHeight = editor.getLayoutInfo().height
    const maxScrollTop = Math.max(0, scrollHeight - viewHeight)

    const canScrollUp = scrollTop > 0
    const canScrollDown = scrollTop < maxScrollTop

    const previousTarget = editor.getTargetAtClientPoint(touch.clientX, touch.clientY - lineHeight)
    const nextTarget = editor.getTargetAtClientPoint(touch.clientX, touch.clientY + lineHeight)
    if (previousTarget === null && nextTarget !== null && canScrollUp) {
        // 触发向上滚动
        const newScrollTop = Math.max(0, scrollTop - lineHeight)
        editor.setScrollTop(newScrollTop, ScrollType.Smooth)
    } else if (previousTarget !== null && nextTarget === null && canScrollDown) {
        // 触发向下滚动
        const newScrollTop = Math.min(maxScrollTop, scrollTop + lineHeight)
        editor.setScrollTop(newScrollTop, ScrollType.Smooth)
    }
}

// 当触点移动到左右边缘时，尝试水平滚动
const scrollLeftExtremityFit = (editor: IStandaloneCodeEditor, touch: Touch, letterWidth: number) => {
    const scrollLeft = editor.getScrollLeft()

    const scrollWidth = editor.getScrollWidth()
    const viewWidth = editor.getLayoutInfo().width
    const maxScrollLeft = Math.max(0, scrollWidth - viewWidth)

    const canScrollLeft = scrollLeft > 0
    const canScrollRight = scrollLeft < maxScrollLeft

    const previousTarget = editor.getTargetAtClientPoint(touch.clientX - letterWidth, touch.clientY)
    const nextTarget = editor.getTargetAtClientPoint(touch.clientX + letterWidth, touch.clientY)
    if (previousTarget === null && nextTarget !== null && canScrollLeft) {
        // 触发向左滚动
        const newScrollLeft = Math.max(0, scrollLeft - letterWidth)
        editor.setScrollLeft(newScrollLeft, ScrollType.Smooth)
    } else if (previousTarget !== null && nextTarget === null && canScrollRight) {
        // 触发向右滚动
        const newScrollLeft = Math.min(maxScrollLeft, scrollLeft + letterWidth)
        editor.setScrollLeft(newScrollLeft, ScrollType.Smooth)
    }
}

export const editorTouchSelectionHelp = (editor: IStandaloneCodeEditor, element: HTMLElement) => {
    const editorOverlayGuard = element.querySelector('.overflow-guard')
    if (!editorOverlayGuard || !(editorOverlayGuard instanceof HTMLElement)) throw new Error("no overlay guard")

    const margin = element.querySelector('.monaco-editor .margin')
    if (!margin || !(margin instanceof HTMLElement)) throw new Error("no margin")
    const leftMargin = margin.offsetWidth

    let selectionsShow = false
    let selections: HTMLDivElement | null = null
    let leftSelector: Selector | null = null
    let rightSelector: Selector | null = null
    const showSelections = () => {
        if (!selections) return
        if (selectionsShow) return
        selectionsShow = true
        selections.classList.add('show')
    }
    const hideSelections = () => {
        if (!selections) return
        if (!selectionsShow) return
        selectionsShow = false
        selections.classList.remove('show')
    }

    let selectorMenuShow = false
    let selectorMenu: HTMLDivElement | null = null
    const showSelectorMenu = () => {
        if (!selectorMenu) return
        if (selectorMenuShow) return
        selectorMenuShow = true
        selectorMenu.classList.add('show')
    }
    const hideSelectorMenu = () => {
        if (!selectorMenu) return
        if (!selectorMenuShow) return
        selectorMenuShow = false
        selectorMenu.classList.remove('show')
    }

    editor.onDidDispose(() => {
        selections?.remove()
        leftSelector?.remove()
        rightSelector?.remove()
        selectorMenu?.remove()

        selections = null
        leftSelector = null
        rightSelector = null
        selectorMenu = null
    })

    const selectAll = () => {
        editor.focus()
        const model = editor.getModel()
        if (model) {
            const fullRange = model.getFullModelRange()
            editor.setSelection(fullRange)
        }
    }

    const copy = async (): Promise<boolean> => {
        try {
            const selection = editor.getSelection()
            if (!selection) return false
            const selectedText = editor.getModel()?.getValueInRange(selection)
            if (!selectedText) return false
            await copyText(selectedText)
            return true
        } catch (e) {
            sendMessage(`copy fail: ${e}`, {type: 'error'})
            return false
        }
    }

    const cut = async (): Promise<boolean> => {
        try {
            const selection = editor.getSelection()
            if (!selection) return false
            const selectedText = editor.getModel()?.getValueInRange(selection)
            if (!selectedText) return false
            await copyText(selectedText)
            editor.executeEdits('cut', [{range: selection, text: ''}])
            return true
        } catch (e) {
            sendMessage(`cut fail: ${e}`, {type: 'error'})
            return false
        }
    }

    const paste = async (): Promise<boolean> => {
        try {
            const selection = editor.getSelection()
            if (!selection) return false

            const text = await readClipBoardText()
            let hasText = false
            if (text) {
                hasText = true
                editor.executeEdits('paste', [{range: selection, text: text}])
            }

            const target = document.activeElement
            if (!target || !element.contains(target)) {
                return hasText
            }

            const dataTransfer = new DataTransfer()

            const imageBlobs = await readClipBoardImageBlob()
            if (!imageBlobs) return hasText

            for (const imageBlob of imageBlobs) {
                const imageFile = await blobToFile(imageBlob, "image")
                dataTransfer.items.add(imageFile)
            }
            const event = new ClipboardEvent("paste", {
                clipboardData: dataTransfer,
            })
            target.dispatchEvent(event)
            return true
        } catch (e) {
            sendMessage(`paste fail: ${e}`, {type: 'error'})
            return false
        }
    }

    const sameSelectorBottomTransform = "translateX(-50%) translateY(25%) rotate(45deg)"
    const leftSelectorBottomTransform = "translateX(-100%) rotate(90deg)"
    const rightSelectorBottomTransform = ""

    const syncSelectionTransform = (selection: Selection) => {
        if (!leftSelector || !rightSelector) return

        const startPosition = selection.getStartPosition()
        const endPosition = selection.getEndPosition()

        // Get the position of the start and end of the selection in client coordinates
        const scrollLeft = editor.getScrollLeft()
        const startCoords = editor.getScrolledVisiblePosition(startPosition)
        const endCoords = editor.getScrolledVisiblePosition(endPosition)

        if (!startCoords || !endCoords) return

        // Get the top position of the start and end lines
        const startTop = editor.getTopForPosition(startPosition.lineNumber, startPosition.column)
        const endTop = editor.getTopForPosition(endPosition.lineNumber, endPosition.column)

        // Calculate positions for the selectors based on line number top positions
        const leftSelectorX = startCoords.left + scrollLeft - leftMargin
        const leftSelectorY = startTop
        const rightSelectorX = endCoords.left + scrollLeft - leftMargin
        const rightSelectorY = endTop

        leftSelector.style.opacity = "1"
        rightSelector.style.opacity = "1"

        leftSelector.style.transform = `translateX(${leftSelectorX}px) translateY(${leftSelectorY}px)`
        rightSelector.style.transform = `translateX(${rightSelectorX}px) translateY(${rightSelectorY}px)`

        if (leftSelectorX === rightSelectorX && leftSelectorY === rightSelectorY) {
            leftSelector.bottomCursor.style.transform = sameSelectorBottomTransform
            rightSelector.bottomCursor.style.transform = sameSelectorBottomTransform
        } else {
            leftSelector.bottomCursor.style.transform = leftSelectorBottomTransform
            rightSelector.bottomCursor.style.transform = rightSelectorBottomTransform
        }
    }

    const selectionSyncTimeout = 400
    let lastSyncTime = 0
    let syncSelectorTimer: number | undefined

    const debounceSyncSelectionTransform = (selection: Selection) => {
        clearTimeout(syncSelectorTimer)
        if (!leftSelector || !rightSelector) return
        const currentSyncTime = Date.now()
        if (currentSyncTime - lastSyncTime < selectionSyncTimeout) {
            lastSyncTime = currentSyncTime
            leftSelector.style.opacity = "0"
            rightSelector.style.opacity = "0"
            syncSelectorTimer = setTimeout(() => {
                syncSelectionTransform(selection)
            }, selectionSyncTimeout)
            return
        } else {
            lastSyncTime = currentSyncTime
            syncSelectionTransform(selection)
        }
    }


    const toSelector = (element: HTMLDivElement): Selector => {
        element.classList.add('selector')

        const textCursor = document.createElement('div')
        textCursor.classList.add('text-cursor')
        element.appendChild(textCursor)

        const bottomCursor = document.createElement('div')
        bottomCursor.classList.add('bottom-cursor')
        element.appendChild(bottomCursor)

        const selector = element as Selector
        selector.textCursor = textCursor
        selector.bottomCursor = bottomCursor

        return selector
    }

    const initSelections = () => {
        selections = document.createElement('div')
        selections.classList.add('selections')

        const leftSelectorEl = document.createElement('div')
        leftSelectorEl.classList.add('left')
        leftSelector = toSelector(leftSelectorEl)
        selections.appendChild(leftSelectorEl)

        const rightSelectorEl = document.createElement('div')
        rightSelectorEl.classList.add('right')
        rightSelector = toSelector(rightSelectorEl)
        selections.appendChild(rightSelectorEl)

        const lineHeight = editor.getOption(EditorOption.lineHeight)
        const fontSize = editor.getOption(EditorOption.fontSize)

        // FIXME 当配置变更时，此处并不会同步更新
        leftSelector.textCursor.style.height = `${lineHeight}px`
        leftSelector.bottomCursor.style.marginTop = `${lineHeight}px`
        rightSelector.textCursor.style.height = `${lineHeight}px`
        rightSelector.bottomCursor.style.marginTop = `${lineHeight}px`

        editorOverlayGuard.append(selections)
        editor.onDidScrollChange((e) => {
            if (selections) {
                selections.style.top = `-${e.scrollTop}px`
                selections.style.left = `-${e.scrollLeft}px`
            }
        })

        const setupSelectorTouchEvent = (
            selector: Selector,
            updateSelection: (selection: Selection, position: Position) => Selection
        ) => {
            const showSelectionMenuByTouch = (touch: Touch) => {
                if (touch && selectorMenu && leftSelector && rightSelector) {
                    showSelectorMenu()

                    const leftRect = leftSelector.getBoundingClientRect()
                    const rightRect = rightSelector.getBoundingClientRect()

                    // 计算 touch 点到 left selector 的距离
                    const leftDistancePow2 = Math.pow(touch.clientX - (leftRect.left + leftRect.width / 2), 2) +
                        Math.pow(touch.clientY - (leftRect.top + leftRect.height / 2), 2)

                    // 计算 touch 点到 right selector 的距离
                    const rightDistancePow2 = Math.pow(touch.clientX - (rightRect.left + rightRect.width / 2), 2) +
                        Math.pow(touch.clientY - (rightRect.top + rightRect.height / 2), 2)

                    // 选择距离更近的 selector
                    const closerRect = leftDistancePow2 <= rightDistancePow2 ? leftRect : rightRect;

                    const elementRect = element.getBoundingClientRect()
                    const menuRect = selectorMenu.getBoundingClientRect()

                    let x = closerRect.left - elementRect.left - menuRect.width / 2
                    if (x > elementRect.width - menuRect.width) x = elementRect.width - menuRect.width
                    if (x < 0) x = 0

                    let y = closerRect.top - elementRect.top - menuRect.height
                    if (y > elementRect.height - menuRect.height) y = elementRect.height - menuRect.height

                    selectorMenu.style.transform = `translateX(${x + elementRect.left}px) translateY(${y + elementRect.top}px)`
                }
            }

            selector.addEventListener('touchstart', (event: TouchEvent) => {
                const initialSelection = editor.getSelection()
                if (!initialSelection) return

                let touch = event.changedTouches[0] ?? event.touches[0]

                let revealTimer = setInterval(() => {
                    scrollTopExtremityFit(editor, touch, lineHeight)
                    scrollLeftExtremityFit(editor, touch, fontSize)
                    const target = editor.getTargetAtClientPoint(touch.clientX, touch.clientY - lineHeight / 2)
                    if (target && target.position) {
                        editor.setSelection(updateSelection(initialSelection, target.position))
                    }
                }, 100)

                const handleMove = (event: TouchEvent) => {
                    event.preventDefault()
                    touch = event.changedTouches[0] ?? event.touches[0]
                }

                const handleEnd = (event: TouchEvent) => {
                    event.preventDefault()
                    touch = event.changedTouches[0] ?? event.touches[0]
                    handleMove(event)
                    clearTimeout(revealTimer)

                    if (selectorMenu && editor.getSelection() !== null) {
                        showSelectionMenuByTouch(touch)
                    }

                    document.removeEventListener('touchmove', handleMove)
                    document.removeEventListener('touchend', handleEnd)
                    document.removeEventListener('touchcancel', handleEnd)
                }

                document.addEventListener('touchmove', handleMove, {passive: false})
                document.addEventListener('touchend', handleEnd)
                document.addEventListener('touchcancel', handleEnd)
            })
        }

        setupSelectorTouchEvent(leftSelector, updateSelectionStart)
        setupSelectorTouchEvent(rightSelector, updateSelectionEnd)

        const setupTextCursorSelectWord = (textSelector: HTMLDivElement) => {
            let lastTouchTime = 0
            textSelector.addEventListener('touchstart', () => {
                const selection = editor.getSelection()
                if (!selection) return
                if (selection?.startColumn !== selection.endColumn || selection.startLineNumber !== selection.endLineNumber) return

                const model = editor.getModel()
                if (!model) return

                const currentTouchTime = Date.now()
                if (currentTouchTime - lastTouchTime > 200) {
                    lastTouchTime = currentTouchTime
                    return
                }

                const word = model.getWordAtPosition(selection.getStartPosition())
                if (word) {
                    editor.setSelection(new Selection(selection.startLineNumber, word.startColumn, selection.startLineNumber, word.endColumn))
                }
            })
        }

        setupTextCursorSelectWord(leftSelector.textCursor)
        setupTextCursorSelectWord(rightSelector.textCursor)

        const selection = editor.getSelection()
        if (selection) debounceSyncSelectionTransform(selection)
    }

    editor.onDidChangeCursorSelection((e) => {
        if (!selections || !selectorMenu) return
        hideSelectorMenu()
        setTimeout(() => {
            debounceSyncSelectionTransform(e.selection)
        }, 0)
    })

    initSelections()

    const initSelectorMenu = () => {
        selectorMenu = document.createElement('div')
        selectorMenu.classList.add('selector-menu')

        // Create and append menu items to the inner menu container
        const menuItems = [
            {
                className: 'copy', text: 'Copy', action: async () => {
                    const result = await copy()
                    if (result) hideSelectorMenu()
                }
            },
            {
                className: 'cut', text: 'Cut', action: async () => {
                    const result = await cut()
                    if (result) hideSelectorMenu()
                }
            },
            {
                className: 'paste', text: 'Paste', action: async () => {
                    const result = await paste()
                    if (result) hideSelectorMenu()
                }
            },
            {
                className: 'select', text: 'Select all', action: () => {
                    selectAll()
                    showSelectorMenu()
                }
            },
        ]

        menuItems.forEach(item => {
            if (!selectorMenu) throw new Error('selectorMenu is not defined')

            const menuItemElement = document.createElement('div')
            menuItemElement.classList.add('selector-menu-item', item.className)
            menuItemElement.innerHTML = `<span>${item.text}</span>`
            menuItemElement.addEventListener('touchend', () => {
                item.action()
            })
            selectorMenu.appendChild(menuItemElement)
        })

        const closeItem = document.createElement('div')
        closeItem.innerHTML = `<svg
    xmlns="http://www.w3.org/2000/svg"
    style="
        display: inline-block;
        user-select: none;
        vertical-align: middle;
        transform: translateY(-0.1rem);
    "
    height="1em"
    width="1em"
    viewBox="0 0 24 24"
    stroke="var(--icon-color)"
    stroke-linecap="round"
    stroke-linejoin="round"
    stroke-width="1.5"
    fill="none"
>
    <path d="M18 6l-12 12" />
    <path d="M6 6l12 12" />
</svg>`
        closeItem.addEventListener('touchend', () => {
            selectorMenu?.classList.remove('show')
        })
        selectorMenu.appendChild(closeItem)

        selectorMenu.addEventListener('touchstart', (event) => {
            event.preventDefault()
        })

        selectorMenu.addEventListener('touchmove', (event) => {
            event.preventDefault()
        })

        selectorMenu.addEventListener('touchend', (event) => {
            event.preventDefault()
        })

        document.documentElement.append(selectorMenu)
    }
    initSelectorMenu()

    element.addEventListener('touchstart', () => {
        showSelections()
    })

    editor.onDidBlurEditorWidget(() => {
        hideSelections()
        hideSelectorMenu()
    })

    element.addEventListener('click', (event) => {
        event.stopPropagation()
    })
}