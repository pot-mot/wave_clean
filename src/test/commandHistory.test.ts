import {BatchCommandData, CommandDefinition, useCommandHistory} from '../history/commandHistory.ts';

type TestCommandMap = {
    testCommand: CommandDefinition<{ value: number }>
}

describe('useCommandHistory', () => {
    let history: ReturnType<typeof useCommandHistory<TestCommandMap>>;

    beforeEach(() => {
        history = useCommandHistory<TestCommandMap>();
    });

    describe('registerCommand', () => {
        it('registers a command with apply and revert actions', () => {
            const applyMock = jest.fn();
            const revertMock = jest.fn();
            history.registerCommand('testCommand', {
                applyAction: applyMock,
                revertAction: revertMock,
            });

            expect(history.__clone_view__.getCommandMap().testCommand).toEqual({
                key: 'testCommand',
                applyAction: applyMock,
                revertAction: revertMock,
            });
        });
    });

    describe('executeCommand', () => {
        it('executes command and pushes to undo stack', () => {
            const applyMock = jest.fn();
            const revertMock = jest.fn();
            history.registerCommand('testCommand', {
                applyAction: applyMock,
                revertAction: revertMock,
            });

            history.executeCommand('testCommand', {value: 10});

            expect(applyMock).toHaveBeenCalled();
            expect(history.__clone_view__.getUndoStack()).toHaveLength(1);
        });
    });

    describe('undo and redo', () => {
        it('undoes command and moves to redo stack', () => {
            const applyMock = jest.fn();
            const revertMock = jest.fn();
            history.registerCommand('testCommand', {
                applyAction: applyMock,
                revertAction: revertMock,
            });

            history.executeCommand('testCommand', {value: 20});
            history.undo();

            expect(revertMock).toHaveBeenCalled();
            expect(history.__clone_view__.getUndoStack()).toHaveLength(0);
            expect(history.__clone_view__.getRedoStack()).toHaveLength(1);

            history.redo();
            expect(applyMock).toHaveBeenCalledTimes(2);
            expect(history.__clone_view__.getRedoStack()).toHaveLength(0);
        });
    });

    describe('batch operations', () => {
        it('executes commands in batch', () => {
            const applyMock = jest.fn();
            const revertMock = jest.fn();
            history.registerCommand('testCommand', {
                applyAction: applyMock,
                revertAction: revertMock,
            });

            const batchKey = Symbol('batch');

            history.startBatch(batchKey);
            history.executeCommand('testCommand', {value: 30});
            history.executeCommand('testCommand', {value: 40});
            history.stopBatch(batchKey);

            expect(history.__clone_view__.getUndoStack()[0]).toBeInstanceOf(Array); // 验证批量命令类型
            expect(history.__clone_view__.getUndoStack()[0]).toHaveLength(2);

            history.undo();

            expect(revertMock).toHaveBeenCalled();
            expect(history.__clone_view__.getRedoStack()[0]).toBeInstanceOf(Array);
            expect(history.__clone_view__.getRedoStack()[0]).toHaveLength(2);
        });

        it('throws error on mismatched batch key', () => {
            const batchKey1 = Symbol('batch1');
            history.startBatch(batchKey1);

            expect(() => history.stopBatch(Symbol('invalid'))).toThrow('stopBatch key is not match');
        });
    });

    describe('nested batches', () => {
        it('handles nested batch operations', () => {
            const applyMock = jest.fn();
            const revertMock = jest.fn();
            history.registerCommand('testCommand', {
                applyAction: applyMock,
                revertAction: revertMock,
            });

            const outerBatch = Symbol('outer');
            const innerBatch = Symbol('inner');

            history.executeBatch(outerBatch, () => {
                history.executeCommand('testCommand', {value: 1});

                history.executeBatch(innerBatch, () => {
                    history.executeCommand('testCommand', {value: 2});

                    expect(history.__clone_view__.getBatchKeyStack()).toHaveLength(2);
                })

                history.executeCommand('testCommand', {value: 1});

                expect(history.__clone_view__.getBatchKeyStack()).toHaveLength(1);
            })

            expect(history.__clone_view__.getUndoStack()[0]).toHaveLength(3);
            expect((history.__clone_view__.getUndoStack()[0] as BatchCommandData<TestCommandMap>)[1]).toHaveLength(1);

            history.undo()

            expect(history.__clone_view__.getRedoStack()[0]).toHaveLength(3);
            expect((history.__clone_view__.getRedoStack()[0] as BatchCommandData<TestCommandMap>)[1]).toHaveLength(1);

            history.redo()

            expect(history.__clone_view__.getUndoStack()[0]).toHaveLength(3);
            expect((history.__clone_view__.getUndoStack()[0] as BatchCommandData<TestCommandMap>)[1]).toHaveLength(1);
        });
    });
});
