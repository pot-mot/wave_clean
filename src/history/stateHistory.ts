import type {Draft, Immutable} from 'immer'
import {produce} from 'immer'
import {computed, shallowRef} from 'vue'

type StateUpdater<T> = (draft: Draft<T>) => void

export const useStateHistory = <T, StateType = Immutable<T>>(baseState: StateType) => {
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

    const undo = () => {
        if (undoStack.length <= 1) return; // 不能撤销到初始状态之前
        const currentState = undoStack.pop()!;
        redoStack.push(currentState);
        stateRef.value = undoStack[undoStack.length - 1];
    };

    const redo = () => {
        if (redoStack.length === 0) return;
        const nextState = redoStack.pop()!;
        undoStack.push(nextState);
        stateRef.value = nextState;
    };

    return {
        state,
        update,
        undo,
        redo,
    } as const
}
