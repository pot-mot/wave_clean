import {cloneDeep} from "lodash";
import {BaseHistory, FullUndefinedHistoryEventsArgs, HistoryEvents} from "@/history/BaseHistory.ts";
import mitt from "mitt";

export type CommandDefinition<ApplyOptions, RevertOptions = ApplyOptions> = {
    applyAction: (options: ApplyOptions) => RevertOptions
    revertAction: (options: RevertOptions) => ApplyOptions | undefined | void
}

export type CustomCommandMap = Record<string, CommandDefinition<any>>

export type HistoryCommand<
    CommandMap extends CustomCommandMap,
    Key extends keyof CommandMap,
    ApplyOptions = Parameters<CommandMap[Key]['applyAction']>[0],
    RevertOptions = Parameters<CommandMap[Key]['revertAction']>[0]
> = {
    key: Key
} & CommandDefinition<ApplyOptions, RevertOptions>

export type HistoryCommandMap<CommandMap extends CustomCommandMap> = {
    [Key in keyof CommandMap]: HistoryCommand<CommandMap, Key>;
}

export type HistoryCommandOption<CommandMap extends CustomCommandMap, Key extends keyof CommandMap> =
    Omit<HistoryCommand<CommandMap, Key>, 'key'>

export type SingleCommandData<CommandMap extends CustomCommandMap, Key extends keyof CommandMap = keyof CommandMap> = {
    command: HistoryCommand<CommandMap, Key>,
    options: Parameters<CommandMap[Key]['applyAction']>[0];
    revertOptions: Parameters<CommandMap[Key]['revertAction']>[0],
}

export type BatchCommandData<CommandMap extends CustomCommandMap> = CommandData<CommandMap>[]

export type CommandData<CommandMap extends CustomCommandMap> =
    SingleCommandData<CommandMap> | BatchCommandData<CommandMap>

type BatchKey<CommandMap extends CustomCommandMap> = { key: symbol, batch: BatchCommandData<CommandMap> }

type CommandChangeInputType = 'apply' | 'revert'

export type CommandChangeInput<CommandMap extends CustomCommandMap, Key extends keyof CommandMap = keyof CommandMap> = {
    type: CommandChangeInputType,
} & SingleCommandData<CommandMap, Key>

export type CommandHistoryEvents<CommandMap extends CustomCommandMap> =
    HistoryEvents<
        Omit<FullUndefinedHistoryEventsArgs, 'beforeChangeInput' | 'changeInput' | 'undoInput' | 'redoInput'> &
        {
            beforeChangeInput: { key: keyof CommandMap, type: CommandChangeInputType },
            changeInput: CommandChangeInput<CommandMap>,
            undoInput: CommandData<CommandMap>,
            redoInput: CommandData<CommandMap>,
        }
    > &
    {
        registerCommand: { key: keyof CommandMap }
        unregisterCommand: { key: keyof CommandMap }
    }

export type CommandHistory<CommandMap extends CustomCommandMap> =
    BaseHistory<
        CommandHistoryEvents<CommandMap>
    > &
    {
        // 命令注册方法
        registerCommand<Key extends keyof CommandMap>(
            key: Key,
            options: HistoryCommandOption<CommandMap, Key>
        ): void;

        unregisterCommand<Key extends keyof CommandMap>(
            key: Key
        ): HistoryCommand<CommandMap, Key>;

        // 执行单个命令
        executeCommand<Key extends keyof CommandMap>(
            key: Key,
            options: Parameters<CommandMap[Key]["applyAction"]>[0],
        ): void;

        // 批次操作相关方法
        startBatch(key: symbol): void;
        stopBatch(key: symbol): void;
        executeBatch(key: symbol, action: () => void): void;
        executeAsyncBatch(key: symbol, action: () => Promise<any>): Promise<void>;

        readonly __clone_view__: {
            getCommandMap: () => HistoryCommandMap<CommandMap>;
            getUndoStack: () => CommandData<CommandMap>[];
            getRedoStack: () => CommandData<CommandMap>[];
            getBatchKeyStack: () => BatchKey<CommandMap>[];
        };
    };

export const useCommandHistory = <CommandMap extends CustomCommandMap>(): CommandHistory<CommandMap> => {
    const commandMap: HistoryCommandMap<CommandMap> =
        {} as HistoryCommandMap<CommandMap>

    const eventBus = mitt<CommandHistoryEvents<CommandMap>>()

    let undoStack: CommandData<CommandMap>[] = []
    let redoStack: CommandData<CommandMap>[] = []

    const batchKeyStack: BatchKey<CommandMap>[] = [];
    let currentBatchKey: BatchKey<CommandMap> | undefined


    let __executeFlag__ = false
    const ifIsExecuteThrow = () => {
        if (__executeFlag__) {
            throw new Error('Execution does not allow nesting')
        }
    }
    const protectExecuteNest = <R>(action: () => R): R => {
        ifIsExecuteThrow()
        __executeFlag__ = true
        try {
            return action()
        } finally {
            __executeFlag__ = false
        }
    }

    const registerCommand = <Key extends keyof CommandMap>(
        key: Key,
        options: HistoryCommandOption<CommandMap, Key>
    ) => {
        if (key in commandMap) {
            throw new Error(`command ${String(key)} is already registered`)
        }

        const applyWrapper = new Proxy(options.applyAction, {
            apply(target, _thisArg, args) {
                return protectExecuteNest(() => target(args[0]))
            }
        })
        const revertWrapper = new Proxy(options.revertAction, {
            apply(target, _thisArg, args) {
                return protectExecuteNest(() => target(args[0]))
            }
        })
        commandMap[key] = {
            key,
            applyAction: applyWrapper,
            revertAction: revertWrapper
        }

        eventBus.emit('registerCommand', {key})
    }

    const unregisterCommand = <Key extends keyof CommandMap>(key: Key) => {
        if (key in commandMap) {
            const command = commandMap[key];
            delete commandMap[key];

            eventBus.emit('unregisterCommand', {key})
            return command
        } else {
            throw new Error(`command ${String(key)} is not registered`);
        }
    };

    const push = (commandData: CommandData<CommandMap>) => {
        if (currentBatchKey !== undefined) {
            currentBatchKey.batch.push(commandData)
        } else {
            undoStack.push(commandData)
            redoStack = []
        }
    }

    const executeCommand = <Key extends keyof CommandMap>(
        key: Key,
        options: Parameters<CommandMap[Key]["applyAction"]>[0],
    ) => {
        const type = 'apply'
        eventBus.emit("beforeChange", {key, type})

        const command = commandMap[key]
        if (command !== undefined) {
            const revertOptions = command.applyAction(options)
            const commandData = {command, options, revertOptions}
            push(commandData)

            eventBus.emit("change", {type, ...commandData})
        }
    }

    const undoCommandData = (commandData: CommandData<CommandMap>) => {
        if (Array.isArray(commandData)) {
            for (const cmd of commandData.reverse()) {
                undoCommandData(cmd)
            }
        } else {
            const {command, revertOptions} = commandData

            const type = 'revert'
            eventBus.emit("beforeChange", {key: command.key, type})
            const newOptions = command.revertAction(revertOptions)
            if (newOptions !== undefined) {
                commandData.options = newOptions
            }
            eventBus.emit("change", {type, ...commandData})
        }
    };

    const redoCommandData = (commandData: CommandData<CommandMap>) => {
        if (Array.isArray(commandData)) {
            for (const cmd of commandData) {
                redoCommandData(cmd)
            }
        } else {
            const {command, options} = commandData

            const type = 'apply'
            eventBus.emit("beforeChange", {key: command.key, type})
            command.applyAction(options)
            eventBus.emit("change", {type, ...commandData})
        }
    };

    const canUndo = () => {
        return !__executeFlag__ && undoStack.length > 0
    }

    const undo = () => {
        ifIsExecuteThrow()
        if (!canUndo()) return

        eventBus.emit("beforeUndo")

        const commandData = undoStack.pop()
        if (commandData !== undefined) {
            redoStack.push(commandData)
            undoCommandData(commandData)

            eventBus.emit("undo", commandData)
        }
    }

    const canRedo = () => {
        return !__executeFlag__ && redoStack.length > 0
    }

    const redo = () => {
        ifIsExecuteThrow()
        if (!canRedo()) return

        eventBus.emit("beforeRedo")

        const commandData = redoStack.pop()
        if (commandData !== undefined) {
            undoStack.push(commandData)
            redoCommandData(commandData)

            eventBus.emit("redo", commandData)
        }
    }

    const startBatch = (key: symbol) => {
        const newBatchKey: BatchKey<CommandMap> = {key, batch: []}
        batchKeyStack.push(newBatchKey)
        currentBatchKey = newBatchKey
    }

    const stopBatch = (key: symbol) => {
        if (currentBatchKey !== undefined && currentBatchKey.key === key) {
            const batch = currentBatchKey.batch

            batchKeyStack.pop()
            currentBatchKey = batchKeyStack.length > 0 ? batchKeyStack[batchKeyStack.length - 1] : undefined

            if (batch.length > 0) {
                push(batch)
            }
        } else {
            throw new Error('stopBatch key is not match')
        }
    }

    const executeBatch = (key: symbol, action: () => void) => {
        startBatch(key)
        try {
            action()
        } finally {
            stopBatch(key)
        }
    }

    const executeAsyncBatch = async (key: symbol, action: () => Promise<any>) => {
        startBatch(key)
        try {
            await action()
        } finally {
            stopBatch(key)
        }
    }

    return {
        eventBus,

        canUndo,
        undo,
        canRedo,
        redo,

        registerCommand,
        unregisterCommand,
        executeCommand,

        startBatch,
        stopBatch,
        executeBatch,
        executeAsyncBatch,

        __clone_view__: {
            getCommandMap: () => cloneDeep(commandMap),
            getUndoStack: () => cloneDeep(undoStack),
            getRedoStack: () => cloneDeep(redoStack),
            getBatchKeyStack: () => cloneDeep(batchKeyStack),
        },
    }
}
