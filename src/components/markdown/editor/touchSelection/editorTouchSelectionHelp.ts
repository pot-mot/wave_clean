// Thanks for https://github.com/Hydralerne/axios-code/blob/main/touch/main.js

import {editor, Position, Selection} from "monaco-editor/esm/vs/editor/editor.api.js"
import {copyText, readClipBoardImageBlob, readClipBoardText} from "@/utils/clipBoard/useClipBoard.ts"
import {throttle} from "lodash-es";
import IStandaloneCodeEditor = editor.IStandaloneCodeEditor;
import EditorOption = editor.EditorOption;
import ScrollType = editor.ScrollType;
import {blobToFile} from "@/utils/file/fileRead.ts";

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

const revealIfTouchVisibleTopOrBottom = throttle((editor: IStandaloneCodeEditor, touch: Touch, lineHeight: number) => {
    const model = editor.getModel()
    if (!model) return

    const visibleRanges = editor.getVisibleRanges()
    if (visibleRanges.length !== 1) return
    const visibleRange = visibleRanges[0]

    const maxLineNumber = model.getLineCount()

    const previousTarget = editor.getTargetAtClientPoint(touch.clientX, touch.clientY - lineHeight)
    if (previousTarget === null && visibleRange.startLineNumber > 1) {
        // 触发向上滚动
        editor.setScrollTop(editor.getScrollTop() - lineHeight, ScrollType.Smooth)
    }

    const nextTarget = editor.getTargetAtClientPoint(touch.clientX, touch.clientY)
    if (nextTarget === null && visibleRange.endLineNumber < maxLineNumber) {
        // 触发向下滚动
        editor.setScrollTop(editor.getScrollTop() + lineHeight, ScrollType.Smooth)
    }
}, 100)

export const editorTouchSelectionHelp = (editor: IStandaloneCodeEditor, element: HTMLElement) => {
    const editorOverlayGuard = element.querySelector('.overflow-guard')
    if (!editorOverlayGuard || !(editorOverlayGuard instanceof HTMLElement)) throw new Error("no overlay guard")

    const margin = element.querySelector('.monaco-editor .margin')
    if (!margin || !(margin instanceof HTMLElement)) throw new Error("no margin")
    const leftLength = margin.offsetWidth

    let selectionsShow = false
    let selectionsContainer: HTMLDivElement | null = null
    let leftSelector: Selector | null = null
    let rightSelector: Selector | null = null
    const showSelections = () => {
        if (!selectionsContainer) return
        if (selectionsShow) return
        selectionsShow = true
        selectionsContainer.classList.remove('hidden')
    }
    const hideSelections = () => {
        if (!selectionsContainer) return
        if (!selectionsShow) return
        selectionsShow = false
        selectionsContainer.classList.add('hidden')
    }

    let selectorMenuShow = false
    let selectorMenu: HTMLDivElement | null = null
    const showSelectorMenu = () => {
        if (!selectorMenu) return
        if (selectorMenuShow) return
        selectorMenuShow = true
        selectorMenu.classList.remove('hidden')
    }
    const hideSelectorMenu = () => {
        if (!selectorMenu) return
        if (!selectorMenuShow) return
        selectorMenuShow = false
        selectorMenu.classList.add('hidden')
    }

    editor.onDidDispose(() => {
        selectionsContainer?.remove()
        leftSelector?.remove()
        rightSelector?.remove()
        selectorMenu?.remove()

        selectionsContainer = null
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

    const copy = async () => {
        const selection = editor.getSelection()
        if (!selection) return
        const selectedText = editor.getModel()?.getValueInRange(selection)
        if (!selectedText) return
        await copyText(selectedText)
    }

    const cut = async () => {
        const selection = editor.getSelection()
        if (!selection) return
        const selectedText = editor.getModel()?.getValueInRange(selection)
        if (!selectedText) return
        await copyText(selectedText)
        editor.executeEdits('', [{range: selection, text: ''}])
    }

    const paste = async () => {
        const selection = editor.getSelection()
        if (!selection) return

        const target = document.activeElement
        if (!element.contains(target)) return

        const dataTransfer = new DataTransfer()

        const imageBlobs = await readClipBoardImageBlob()
        if (imageBlobs) {
            for (const imageBlob of imageBlobs) {
                const imageFile = await blobToFile(imageBlob, "image")
                dataTransfer.items.add(imageFile)
            }
        }

        const text = await readClipBoardText()
        dataTransfer.setData('text/plain', text)

        const event = new ClipboardEvent("paste", {
            clipboardData: dataTransfer,
        })
        target?.dispatchEvent(event)
    }

    const syncSelectionTransform = (selection: Selection) => {
        const startPosition = selection.getStartPosition()
        const endPosition = selection.getEndPosition()

        // Get the position of the start and end of the selection in client coordinates
        const startCoords = editor.getScrolledVisiblePosition(startPosition)
        const endCoords = editor.getScrolledVisiblePosition(endPosition)

        if (startCoords && endCoords && leftSelector && rightSelector) {
            // Get the top position of the start and end lines
            const startTop = editor.getTopForPosition(startPosition.lineNumber, startPosition.column)
            const endTop = editor.getTopForPosition(endPosition.lineNumber, endPosition.column)

            // Calculate positions for the selectors based on line number top positions
            const leftSelectorX = startCoords.left - leftLength
            const leftSelectorY = startTop
            const rightSelectorX = endCoords.left - leftLength
            const rightSelectorY = endTop

            leftSelector.style.transform = `translateX(${leftSelectorX}px) translateY(${leftSelectorY}px)`
            rightSelector.style.transform = `translateX(${rightSelectorX}px) translateY(${rightSelectorY}px)`
            if (leftSelectorX === rightSelectorX && leftSelectorY === rightSelectorY) {
                leftSelector.bottomCursor.style.transform = `translateX(-50%) translateY(25%) rotate(45deg)`
                rightSelector.bottomCursor.style.transform = `translateX(-50%) translateY(25%) rotate(45deg)`
            } else {
                leftSelector.bottomCursor.style.transform = `translateX(-100%) rotate(90deg)`
                rightSelector.bottomCursor.style.transform = ``
            }
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
        selectionsContainer = document.createElement('div')
        selectionsContainer.classList.add('selections', 'hidden')

        const leftSelectorEl = document.createElement('div')
        leftSelectorEl.classList.add('left')
        leftSelector = toSelector(leftSelectorEl)
        selectionsContainer.appendChild(leftSelectorEl)

        const rightSelectorEl = document.createElement('div')
        rightSelectorEl.classList.add('right')
        rightSelector = toSelector(rightSelectorEl)
        selectionsContainer.appendChild(rightSelectorEl)

        const lineHeight = editor.getOption(EditorOption.lineHeight)
        // FIXME 当配置变更时，此处并不会同步更新
        leftSelector.textCursor.style.height = `${lineHeight}px`
        leftSelector.bottomCursor.style.marginTop = `${lineHeight}px`
        rightSelector.textCursor.style.height = `${lineHeight}px`
        rightSelector.bottomCursor.style.marginTop = `${lineHeight}px`

        editorOverlayGuard.append(selectionsContainer)
        editor.onDidScrollChange((e) => {
            if (selectionsContainer) {
                selectionsContainer.style.top = `-${e.scrollTop}px`
            }
        })


        const setupSelectorTouchEvent = (
            selector: Selector,
            updateSelection: (selection: Selection, position: Position) => Selection
        ) => {
            let timeout: number | undefined

            selector.addEventListener('touchstart', (event) => {
                const touch = event.changedTouches[0] ?? event.touches[0]
                const initialSelection = editor.getSelection()
                timeout = setTimeout(() => {
                    if (touch && selectorMenu) {
                        showSelectorMenu()
                        const elementRect = element.getBoundingClientRect()
                        const selectorRect = selector.getBoundingClientRect()
                        const menuRect = selectorMenu.getBoundingClientRect()

                        let x = selectorRect.left - elementRect.left - menuRect.width / 2
                        if (x > elementRect.width - menuRect.width) x = elementRect.width - menuRect.width
                        if (x < 0) x = 0

                        let y = selectorRect.top - elementRect.top - menuRect.height
                        if (y > elementRect.height - menuRect.height) y = elementRect.height - menuRect.height
                        if (y < 0) y = 0

                        selectorMenu.style.transform = `translateX(${x}px) translateY(${y}px)`
                    }
                }, 400)

                const handleMove = (event: TouchEvent) => {
                    const touch = event.changedTouches[0] ?? event.touches[0]
                    const target = editor.getTargetAtClientPoint(touch.clientX, touch.clientY - lineHeight / 2)
                    if (timeout !== undefined) {
                        clearTimeout(timeout)
                        timeout = undefined
                    }
                    if (target && target.position && initialSelection) {
                        editor.setSelection(updateSelection(initialSelection, target.position))
                    }

                    revealIfTouchVisibleTopOrBottom(editor, touch, lineHeight)
                }

                const handleEnd = (event: TouchEvent) => {
                    event.preventDefault()
                    handleMove(event)
                    document.removeEventListener('touchmove', handleMove)
                    document.removeEventListener('touchend', handleEnd)
                    document.removeEventListener('touchcancel', handleEnd)
                }

                document.addEventListener('touchmove', handleMove)
                document.addEventListener('touchend', handleEnd)
                document.addEventListener('touchcancel', handleEnd)
            })
        }

        setupSelectorTouchEvent(leftSelector, updateSelectionStart)
        setupSelectorTouchEvent(rightSelector, updateSelectionEnd)

        const selection = editor.getSelection()
        if (selection) syncSelectionTransform(selection)
    }

    editor.onDidChangeCursorSelection((e) => {
        if (!selectionsContainer || !selectorMenu) return
        syncSelectionTransform(e.selection)
        hideSelectorMenu()
    })

    initSelections()

    const initSelectorMenu = () => {
        selectorMenu = document.createElement('div')
        selectorMenu.classList.add('selector-menu', 'hidden')

        // Create and append menu items to the inner menu container
        const menuItems = [
            {className: 'copy', text: 'Copy', action: copy},
            {className: 'cut', text: 'Cut', action: cut},
            {className: 'paste', text: 'Paste', action: paste},
            {className: 'select', text: 'Select all', action: selectAll},
        ]

        menuItems.forEach(item => {
            if (!selectorMenu) throw new Error('selectorMenu is not defined')

            const menuItemElement = document.createElement('div')
            menuItemElement.classList.add('selector-menu-item', item.className)
            menuItemElement.innerHTML = `<span>${item.text}</span>`
            menuItemElement.ontouchend = () => {
                item.action()
                selectorMenu?.classList.add('hidden')
            }
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
        closeItem.ontouchend = () => {
            selectorMenu?.classList.add('hidden')
        }
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

        editorOverlayGuard.append(selectorMenu)
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