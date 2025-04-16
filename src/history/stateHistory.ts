import type {Draft, Immutable} from 'immer'
import {produce} from 'immer'
import {computed, ComputedRef, shallowRef} from 'vue'
import {BaseHistory, FullUndefinedHistoryEventsArgs, HistoryEvents} from "@/history/BaseHistory.ts";
import mitt from "mitt";

type StateUpdater<T> = (draft: Draft<T>) => void

export type StateHistoryEvents<StateType> = HistoryEvents<
    Omit<FullUndefinedHistoryEventsArgs, 'beforeChangeInput' | 'changeInput' | 'undoInput' | 'redoInput'> &
    {
        beforeChangeInput: StateType,
        changeInput: StateType,
        undoInput: StateType,
        redoInput: StateType,
    }
>

export type StateHistory<StateType> =
    BaseHistory<
        StateHistoryEvents<StateType>
    > &
    {
        state: ComputedRef<StateType>
        update: (updater: StateUpdater<StateType>) => void

        __view__: {
            getUndoStack: () => ReadonlyArray<StateType>
            getRedoStack: () => ReadonlyArray<StateType>
        };
    }

export const useStateHistory = <T, StateType = Immutable<T>>(baseState: StateType): StateHistory<StateType> => {
    const eventBus = mitt<StateHistoryEvents<StateType>>()

    let undoStack: StateType[] = [baseState];
    let redoStack: StateType[] = [];

    const stateRef = shallowRef<StateType>(
        produce<StateType>(baseState, () => {
        })
    )
    const changeState = (newState: StateType) => {
        eventBus.emit("beforeChange", stateRef.value)
        stateRef.value = newState
        eventBus.emit("change", newState)
    }

    const update = (updater: StateUpdater<StateType>) => {
        const newState = produce<StateType>(stateRef.value, updater)
        undoStack.push(newState)
        redoStack = [] // 清空重做栈
        changeState(newState)
    }

    const canUndo = () => {
        return undoStack.length > 1
    }
    const undo = () => {
        if (!canUndo()) return

        eventBus.emit("beforeUndo")

        const beforeState = undoStack.pop()
        if (beforeState !== undefined) {
            redoStack.push(beforeState);
            changeState(undoStack[undoStack.length - 1])

            eventBus.emit("undo", beforeState)
        }
    }

    const canRedo = () => {
        return redoStack.length > 0
    }
    const redo = () => {
        if (!canRedo()) return;

        eventBus.emit("beforeUndo")

        const nextState = redoStack.pop()
        if (nextState !== undefined) {
            undoStack.push(nextState)
            changeState(nextState)

            eventBus.emit("redo", nextState)
        }
    }

    const state = computed<StateType>(() => stateRef.value)

    return {
        eventBus,

        canUndo,
        undo,
        canRedo,
        redo,

        state,
        update,

        __view__: {
            getUndoStack: () => undoStack.slice(),
            getRedoStack: () => redoStack.slice(),
        },
    } as const
}
