import {GraphIdItem, GraphSubItem, toId} from "@/graph/baseType/GraphItem.ts";
import {DeepReadonly} from "vue";

export type GSelection<T extends GraphSubItem<any> & GraphIdItem> = DeepReadonly<
    {
        add: (item: T) => void,
        get: (id: symbol) => T | undefined,
        has: (id: symbol) => boolean,

        selectedIdSet: Set<symbol>,

        select: (...args: (T | symbol)[]) => void,
        unselect: (...args: (T | symbol)[]) => void,
        toggleSelect: (...args: (T | symbol)[]) => void,
        clear: () => void,
        isSelected: (arg: T | symbol) => boolean,
    }
>

export const createSelection = <T extends GraphSubItem<any> & GraphIdItem & {
    on<Key extends "delete" | string>(
        type: Key,
        handler: (event: any) => void
    ): void;
}>(): GSelection<T> => {
    const map = new Map<symbol, T>();
    const selectedIdSet = new Set<symbol>();

    const add = (item: T) => {
        item.on('delete', () => {
            if (selectedIdSet.has(item.id)) {
                selectedIdSet.delete(item.id)
                item.unselect()
            }
            map.delete(item.id)
        })
        map.set(item.id, item)
    }

    const get = (id: symbol): T | undefined => {
        return map.get(id)
    }

    const has = (id: symbol): boolean => {
        return map.has(id)
    }

    return {
        add,
        get,
        has,

        selectedIdSet,

        select(...args: (T | symbol)[]): void {
            for (const arg of args) {
                const id = toId(arg)
                const item = map.get(id)
                if (item !== undefined) {
                    selectedIdSet.add(id)
                    item.select()
                }
            }
        },

        unselect(...args: (T | symbol)[]): void {
            for (const arg of args) {
                const id = toId(arg)
                map.get(id)?.unselect()
                selectedIdSet.delete(id)
            }
        },

        toggleSelect(...args: (T | symbol)[]): void {
            for (const arg of args) {
                const id = toId(arg)
                const item = map.get(id)
                if (item !== undefined) {
                    if (selectedIdSet.has(id)) {
                        selectedIdSet.delete(id)
                        item.unselect()
                    } else {
                        selectedIdSet.add(id)
                        item.select()
                    }
                }
            }
        },

        clear(): void {
            for (const id of selectedIdSet) {
                selectedIdSet.delete(id)
                map.get(id)?.unselect()
            }
        },

        isSelected(arg: T | symbol): boolean {
            return selectedIdSet.has(toId(arg));
        },
    }
}
