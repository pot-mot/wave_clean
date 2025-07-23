// Thanks for https://github.com/Hydralerne/axios-code/blob/main/touch/main.js

import {editor, Selection, Position} from "monaco-editor/esm/vs/editor/editor.api.js"
import IStandaloneCodeEditor = editor.IStandaloneCodeEditor
import {copyText, readClipBoardText} from "@/utils/clipBoard/useClipBoard.ts"

export const editorTouchSelectionHelp = (editor: IStandaloneCodeEditor, element: HTMLElement) => {
    const editorOverlayGuard = element.querySelector('.overflow-guard')
    if (!editorOverlayGuard || !(editorOverlayGuard instanceof HTMLElement)) throw new Error("no overlay guard")

    const margin = element.querySelector('.monaco-editor .margin')
    if (!margin || !(margin instanceof HTMLElement)) throw new Error("no margin")
    const leftLength = margin.offsetWidth

    let disabledMove = false
    let selectionsContainer: HTMLDivElement | null = null
    let leftSelector: HTMLDivElement | null = null
    let rightSelector: HTMLDivElement | null = null
    let selectorMenu: HTMLDivElement | null = null

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

    const initializeSelector = () => {
        // Create the selectors container
        selectionsContainer = document.createElement('div')
        selectionsContainer.className = 'selections hidden'

        // Create the right-selector and left-selector divs
        rightSelector = document.createElement('div')
        rightSelector.className = 'selector right-selector'
        leftSelector = document.createElement('div')
        leftSelector.className = 'selector left-selector'

        // Append the selectors to the container
        selectionsContainer.appendChild(rightSelector)
        selectionsContainer.appendChild(leftSelector)

        editorOverlayGuard.append(selectionsContainer)
        editor.onDidScrollChange((e) => {
            if (selectionsContainer) {
                selectionsContainer.style.top = `-${e.scrollTop}px`
            }
        })

        const handleSelectorTouch = (selector: HTMLDivElement, isLeft: boolean) => {
            let initialSelection: Selection | null = null
            let touchMoved = false  // Track if touchmove occurred

            selector.addEventListener('touchstart', (event) => {
                initialSelection = editor.getSelection()
                touchMoved = false  // Reset touchMoved flag
                event.preventDefault()
                disabledMove = true
            })

            selector.addEventListener('touchmove', (event) => {
                const touch = event.changedTouches[0] ?? event.touches[0]
                const target = editor.getTargetAtClientPoint(touch.clientX, touch.clientY)

                if (target && target.position && initialSelection) {
                    const newSelection = isLeft
                        ? new Selection(
                            target.position.lineNumber,
                            target.position.column,
                            initialSelection.endLineNumber,
                            initialSelection.endColumn
                        )
                        : new Selection(
                            initialSelection.startLineNumber,
                            initialSelection.startColumn,
                            target.position.lineNumber,
                            target.position.column
                        )
                    editor.setSelection(newSelection)
                    touchMoved = true  // Mark that touchmove occurred
                }
                event.preventDefault()
            })

            selector.addEventListener('touchend', (event) => {
                if (!touchMoved) {
                    const touch = event.changedTouches[0] ?? event.touches[0]
                    const target = editor.getTargetAtClientPoint(touch.clientX, touch.clientY)

                    if (target && target.position && initialSelection) {
                        const newSelection = isLeft
                            ? new Selection(
                                target.position.lineNumber,
                                target.position.column,
                                initialSelection.endLineNumber,
                                initialSelection.endColumn
                            )
                            : new Selection(
                                initialSelection.startLineNumber,
                                initialSelection.startColumn,
                                target.position.lineNumber,
                                target.position.column
                            )
                        editor.setSelection(newSelection)
                    }
                }
                initialSelection = null
                touchMoved = false
            })
        }

        handleSelectorTouch(leftSelector, true)
        handleSelectorTouch(rightSelector, false)
    }

    editor.onDidChangeCursorSelection((e) => {
        if (!selectionsContainer || !selectorMenu) return

        const selection = e.selection
        const startPosition = selection.getStartPosition()
        const endPosition = selection.getEndPosition()

        if (selection.isEmpty()) {
            // Hide the selections container when there's no selection
            selectionsContainer.classList.add('hidden')
            selectorMenu.classList.add('hidden')
            return
        }

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

            // Update the left-selector position
            leftSelector.style.transform = `translateX(calc(${leftSelectorX}px - 1.5em)) translateY(${leftSelectorY}px)`
            // Update the right-selector position
            rightSelector.style.transform = `translateX(${rightSelectorX}px) translateY(${rightSelectorY}px)`
        }

        // Show the selections container when there is a selection
        selectionsContainer.classList.remove('hidden')
    })

    initializeSelector()


    // selectorMenu
    selectorMenu = document.createElement('div')
    selectorMenu.className = 'selector-menu hidden'

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
        menuItemElement.className = `selector-menu-item ${item.className}`
        menuItemElement.innerHTML = `<span>${item.text}</span>`
        menuItemElement.ontouchstart = () => {
            menuItemElement.classList.add('hovered')
        }
        menuItemElement.ontouchmove = () => {
            menuItemElement.classList.remove('hovered')
        }
        menuItemElement.ontouchend = () => {
            menuItemElement.classList.remove('hovered')
            item.action()
            selectorMenu?.classList.add('hidden')
        }
        selectorMenu.appendChild(menuItemElement)
    })

    selectorMenu.addEventListener('touchstart', (event) => {
        event.preventDefault()
        disabledMove = true
    })

    selectorMenu.addEventListener('touchmove', (event) => {
        event.preventDefault()
        disabledMove = true
    })

    selectorMenu.addEventListener('touchend', (event) => {
        event.preventDefault()
        disabledMove = false
    })

    editorOverlayGuard.append(selectorMenu)

    let touchTimeout: number
    let touchCount = 0
    let startPosition: Position
    let isSelecting = false

    const isPositionInSelection = (position: Position) => {
        const selection = editor.getSelection()
        if (!selection || selection.isEmpty()) {
            return false
        }

        const startPosition = selection.getStartPosition()
        const endPosition = selection.getEndPosition()

        // Compare the position with the selection range
        return (
            position.lineNumber > startPosition.lineNumber ||
            (position.lineNumber === startPosition.lineNumber && position.column >= startPosition.column)
        ) && (
            position.lineNumber < endPosition.lineNumber ||
            (position.lineNumber === endPosition.lineNumber && position.column <= endPosition.column)
        )
    }

    element.addEventListener('touchstart', (event) => {
        if (event.target instanceof HTMLElement &&
            (
                (selectorMenu && selectorMenu.contains(event.target)) ||
                (selectionsContainer && selectionsContainer.contains(event.target))
            )
        ) {
            event.stopPropagation()
            event.preventDefault()
        }
        touchCount++
        if (touchTimeout) {
            clearTimeout(touchTimeout)
        }

        touchTimeout = setTimeout(() => {
            // in here, want get YValue based on offset top like the value of the rouched line to document
            isSelecting = true
            if (!isPositionInSelection(startPosition)) {
                editor.setPosition(startPosition)
            }

            const scrollPosition = editor.getScrolledVisiblePosition(startPosition)
            if (scrollPosition) {
                showContextMenu(scrollPosition)
            }
        }, 500) // 0.5 second long press to show context menu
        const touch = event.touches[0]
        const target = editor.getTargetAtClientPoint(touch.clientX, touch.clientY)
        if (target && target.position) {
            startPosition = target.position
        }
    })

    element.addEventListener('touchend', () => {
        if (touchTimeout) {
            clearTimeout(touchTimeout)
        }
        if (isSelecting) {
            isSelecting = false
        }
        if (disabledMove) {
            disabledMove = false
        }
    })

    element.addEventListener('touchmove', (event) => {
        if (touchTimeout) {
            clearTimeout(touchTimeout)
        }

        if (disabledMove) {
            event.preventDefault()
            event.stopPropagation()
        }

        if (startPosition && isSelecting) {
            event.preventDefault()
            event.stopPropagation()
            const touch = event.touches[0]
            const target = editor.getTargetAtClientPoint(touch.clientX, touch.clientY)
            if (target && target.position) {
                editor.setSelection(new Selection(startPosition.lineNumber, startPosition.column, target.position.lineNumber, target.position.column))
                isSelecting = true
            }
        }
    })

    const showContextMenu = (position: {top: number, left: number, height: number}) => {
        if (!selectorMenu) throw new Error('selectorMenu is not defined')

        let x = position.left - selectorMenu.offsetWidth / 2
        let y = position.top - selectorMenu.offsetHeight - 3
        console.log(x, y)

        selectorMenu.style.transform = `translateY(${y}px) translateX(${x}px)`
        selectorMenu.classList.remove('hidden')
    }

    element.addEventListener('click', (event) => {
        event.stopPropagation()
    })
}