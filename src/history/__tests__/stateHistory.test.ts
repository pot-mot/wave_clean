import {describe, it, expect} from 'vitest'
import {useStateHistory} from "@/history/stateHistory";

describe('useStateHistory', () => {
    it('test updater', () => {
        const initState = {
            name: "a",
            age: 12,
            hobbies: [
                {
                    name: "eat",
                }
            ]
        }

        const history = useStateHistory<typeof initState>(initState)

        history.update((draft) => {
            draft.name = "b"
        })
        expect(history.state.value.name).toEqual("b")
        expect(history.__view__.getUndoStack()).toHaveLength(2)

        history.undo()

        expect(history.state.value.name).toEqual("a")
        expect(history.__view__.getUndoStack()).toHaveLength(1)
        expect(history.__view__.getRedoStack()).toHaveLength(1)

        history.redo()

        expect(history.state.value.name).toEqual("b")
        expect(history.__view__.getUndoStack()).toHaveLength(2)
        expect(history.__view__.getRedoStack()).toHaveLength(0)
    })
})
