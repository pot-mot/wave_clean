import {useStateHistory} from "@/history/stateHistory.ts";

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

        const {state, update} = useStateHistory<typeof initState>(initState)

        update((draft) => {
            draft.name = "b"
        })
        expect(state.value.name).toEqual("b")
    })
})
