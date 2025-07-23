// Thanks for https://github.com/Hydralerne/axios-code/blob/main/touch/main.js

import {editor, Position, Selection} from "monaco-editor/esm/vs/editor/editor.api.js"
import {copyText, readClipBoardText} from "@/utils/clipBoard/useClipBoard.ts"
import {throttle} from "lodash-es";
import IStandaloneCodeEditor = editor.IStandaloneCodeEditor;
import EditorOption = editor.EditorOption;
import ScrollType = editor.ScrollType;

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
    let leftSelector: HTMLDivElement | null = null
    let rightSelector: HTMLDivElement | null = null
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
        const text = await readClipBoardText()
        editor.executeEdits('', [{range: selection, text}])
    }

    const syncSelectionTransform = (selection: Selection) => {
        const startPosition = selection.getStartPosition()
        const endPosition = selection.getEndPosition()

        // Get the top position of the start and end lines
        const startLineTop = editor.getTopForLineNumber(startPosition.lineNumber)
        const endLineTop = editor.getTopForLineNumber(endPosition.lineNumber)

        // Get the position of the start and end of the selection in client coordinates
        const startCoords = editor.getScrolledVisiblePosition(startPosition)
        const endCoords = editor.getScrolledVisiblePosition(endPosition)

        if (startCoords && endCoords && leftSelector && rightSelector) {
            // Calculate positions for the selectors based on line number top positions
            const leftSelectorX = startCoords.left - leftLength
            const leftSelectorY = startLineTop
            const rightSelectorX = endCoords.left - leftLength
            const rightSelectorY = endLineTop

            leftSelector.style.transform = `translateX(calc(${leftSelectorX}px - 0.75em)) translateY(${leftSelectorY}px) rotate(45deg)`
            rightSelector.style.transform = `translateX(calc(${rightSelectorX}px - 0.75em)) translateY(${rightSelectorY}px) rotate(45deg)`
        }
    }

    const initSelections = () => {
        selectionsContainer = document.createElement('div')
        selectionsContainer.className = 'selections hidden'

        leftSelector = document.createElement('div')
        leftSelector.className = 'selector left-selector'
        selectionsContainer.appendChild(leftSelector)

        rightSelector = document.createElement('div')
        rightSelector.className = 'selector right-selector'
        selectionsContainer.appendChild(rightSelector)

        editorOverlayGuard.append(selectionsContainer)
        editor.onDidScrollChange((e) => {
            if (selectionsContainer) {
                selectionsContainer.style.top = `-${e.scrollTop}px`
            }
        })


        const setupSelectorTouchEvent = (
            selector: HTMLDivElement,
            updateSelection: (selection: Selection, position: Position) => Selection
        ) => {
            let timeout: number | undefined

            selector.addEventListener('touchstart', (event) => {
                const touch = event.changedTouches[0] ?? event.touches[0]
                const initialSelection = editor.getSelection()
                const lineHeight = editor.getOption(EditorOption.lineHeight)
                timeout = setTimeout(() => {
                    if (touch && selectorMenu) {
                        const elementRect = element.getBoundingClientRect()
                        const selectorRect = selector.getBoundingClientRect()
                        const x = selectorRect.left - elementRect.left
                        const y = selectorRect.top - elementRect.top - lineHeight
                        selectorMenu.style.transform = `translateX(calc(${x}px - 50%)) translateY(calc(${y}px - 100%))`
                        showSelectorMenu()
                    }
                }, 500)

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
        selectorMenu.className = 'selector-menu hidden'

        // Create and append menu items to the inner menu container
        const menuItems = [
            {className: 'copy', text: 'Copy', action: copy},
            {className: 'cut', text: 'Cut', action: cut},
            {className: 'paste', text: 'Paste', action: paste},
            {className: 'select', text: 'Select all', action: selectAll},
            {className: 'close', text: 'close', action: () => {}}
        ]

        menuItems.forEach(item => {
            if (!selectorMenu) throw new Error('selectorMenu is not defined')

            const menuItemElement = document.createElement('div')
            menuItemElement.className = `selector-menu-item ${item.className}`
            menuItemElement.innerHTML = `<span>${item.text}</span>`
            menuItemElement.ontouchend = () => {
                item.action()
                selectorMenu?.classList.add('hidden')
            }
            selectorMenu.appendChild(menuItemElement)
        })

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