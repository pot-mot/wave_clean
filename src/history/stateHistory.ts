import type {Draft, Immutable} from 'immer'
import {produce} from 'immer'
import {computed, ComputedRef, shallowRef} from 'vue'
import {BaseHistory} from "@/history/BaseHistory.ts";

type StateUpdater<T> = (draft: Draft<T>) => void

export type StateHistory<StateType> = BaseHistory & {
    state: ComputedRef<StateType>
    update: (updater: StateUpdater<StateType>) => void

    __view__: {
        getUndoStack: () => ReadonlyArray<StateType>
        getRedoStack: () => ReadonlyArray<StateType>
    };
}

export const useStateHistory = <T, StateType = Immutable<T>>(baseState: StateType): StateHistory<StateType> => {
    let undoStack: StateType[] = [baseState];
    let redoStack: StateType[] = [];

    const stateRef = shallowRef<StateType>(produce<StateType>(baseState, () => {}))
    const update = (updater: StateUpdater<StateType>) => {
        const newState = produce<StateType>(stateRef.value, updater);
        undoStack.push(newState);
        redoStack = []; // 清空重做栈
        stateRef.value = newState;
    }
    const state = computed<StateType>(() => stateRef.value)

    const canUndo = () => {
        return undoStack.length > 1
    }
    const undo = () => {
        if (!canUndo()) return; // 不能撤销到初始状态之前
        const currentState = undoStack.pop()!;
        redoStack.push(currentState);
        stateRef.value = undoStack[undoStack.length - 1];
    };

    const canRedo = () => {
        return redoStack.length > 0
    }
    const redo = () => {
        if (!canRedo()) return;
        const nextState = redoStack.pop()!;
        undoStack.push(nextState);
        stateRef.value = nextState;
    };

    return {
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
