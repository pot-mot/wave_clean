import {cloneDeep} from "lodash";

export type CommandDefinition<ApplyOptions, RevertOptions = ApplyOptions> = {
    applyAction: (options: ApplyOptions) => RevertOptions
    revertAction: (options: RevertOptions) => void
}

export type CustomCommandMap = Record<string, CommandDefinition<any>>

export type HistoryCommand<
    CommandMap extends CustomCommandMap,
    Key extends keyof CommandMap,
    ApplyOptions = Parameters<CommandMap[Key]['applyAction']>[0],
    RevertOptions = Parameters<CommandMap[Key]['revertAction']>[0]
> = {
    key: Key
    applyAction: (options: ApplyOptions) => RevertOptions
    revertAction: (options: RevertOptions) => void
}

export type HistoryCommandMap<CommandMap extends CustomCommandMap> = {
    [Key in keyof CommandMap]: HistoryCommand<CommandMap, Key>;
}

export type CustomHistoryOption<CommandMap extends CustomCommandMap, Key extends keyof CommandMap> =
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

export type CommandHistory<CommandMap extends CustomCommandMap> = {
    // 命令注册方法
    registerCommand<Key extends keyof CommandMap>(
        key: Key,
        options: CustomHistoryOption<CommandMap, Key>
    ): void;

    // 执行单个命令
    executeCommand<Key extends keyof CommandMap>(
        key: Key,
        options: Parameters<CommandMap[Key]["applyAction"]>[0],
    ): void;

    // 撤销操作
    undo(): void;

    // 重做操作
    redo(): void;

    // 批次操作相关方法
    startBatch(key: symbol): void;
    stopBatch(key: symbol): void;
    executeBatch(key: symbol, action: () => void): void;
    executeAsyncBatch(key: symbol, action: () => Promise<any>): Promise<void>;

    __clone_view__: {
        getCommandMap: () => HistoryCommandMap<CommandMap>;
        getUndoStack: () => CommandData<CommandMap>[];
        getRedoStack: () => CommandData<CommandMap>[];
        getBatchKeyStack: () => BatchKey<CommandMap>[];
    };
};

export const useCommandHistory = <CommandMap extends CustomCommandMap>(): CommandHistory<CommandMap> => {
    const commandMap: HistoryCommandMap<CommandMap> =
        {} as HistoryCommandMap<CommandMap>

    let undoStack: CommandData<CommandMap>[] = []
    let redoStack: CommandData<CommandMap>[] = []

    const batchKeyStack: BatchKey<CommandMap>[] = [];
    let currentBatchKey: BatchKey<CommandMap> | undefined


    let __executeFlag = false
    const ifIsExecuteThrow = () => {
        if (__executeFlag) {
            throw new Error('Execution does not allow nesting')
        }
    }
    const protectExecuteNest = <R>(action: () => R): R => {
        ifIsExecuteThrow()
        __executeFlag = true
        try {
            return action()
        } finally {
            __executeFlag = false
        }
    }

    const registerCommand = <Key extends keyof CommandMap>(
        key: Key,
        options: CustomHistoryOption<CommandMap, Key>
    ) => {
        if (!(key in commandMap)) {
            const applyWrapper = new Proxy(options.applyAction, {
                apply(target, _thisArg, args) {
                    return protectExecuteNest(() => {
                        target(args[0])
                    })
                }
            })
            const revertWrapper = new Proxy(options.revertAction, {
                apply(target, _thisArg, args) {
                    return protectExecuteNest(() => {
                        target(args[0])
                    })
                }
            })
            commandMap[key] = {
                key,
                applyAction: applyWrapper,
                revertAction: revertWrapper
            }
        } else {
            throw new Error(`command ${String(key)} is already registered`)
        }
    }

    const push = (commandData: CommandData<CommandMap>) => {
        if (currentBatchKey !== undefined) {
            currentBatchKey.batch.push(commandData)
        } else {
            undoStack.push(commandData);
            redoStack = [];
        }
    }

    const executeCommand = <Key extends keyof CommandMap>(
        key: Key,
        options: Parameters<CommandMap[Key]["applyAction"]>[0],
    ) => {
        const command = commandMap[key]
        if (command !== undefined) {
            const revertOptions = command.applyAction(options)
            push({command: command as any as HistoryCommand<CommandMap, keyof CommandMap>, options, revertOptions})
        }
    }

    const undoCommandData = (commandData: CommandData<CommandMap>) => {
        if (Array.isArray(commandData)) {
            for (const cmd of commandData.reverse()) {
                undoCommandData(cmd)
            }
        } else {
            const {command, revertOptions} = commandData
            command.revertAction(revertOptions)
        }
    };

    const redoCommandData = (commandData: CommandData<CommandMap>) => {
        if (Array.isArray(commandData)) {
            for (const cmd of commandData) {
                redoCommandData(cmd)
            }
        } else {
            const {command, options} = commandData
            command.applyAction(options)
        }
    };

    const undo = () => {
        ifIsExecuteThrow()
        if (undoStack.length === 0) return;
        const commandData = undoStack.pop()
        if (commandData !== undefined) {
            redoStack.push(commandData)
            undoCommandData(commandData)
        }
    }

    const redo = () => {
        ifIsExecuteThrow()
        if (redoStack.length === 0) return;
        const commandData = redoStack.pop()
        if (commandData !== undefined) {
            undoStack.push(commandData)
            redoCommandData(commandData)
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
        registerCommand,
        executeCommand,
        undo,
        redo,
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
