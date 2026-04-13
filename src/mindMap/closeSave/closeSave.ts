import {noTauriInvokeSubstitution} from '@/utils/error/noTauriInvokeSubstitution.ts';
import {useMindMapStore} from '@/store/mindMapStore.ts';
import {sendConfirm} from '@/components/confirm/confirmApi.ts';
import {translate} from '@/store/i18nStore.ts';
import {listen} from '@tauri-apps/api/event';
import {getCurrentWindow} from '@tauri-apps/api/window';

export const confirmSave = () => {
    return new Promise<boolean>(async (resolve) => {
        await sendConfirm({
            title: translate('save_confirm'),
            content: translate({
                key: 'save_confirm_content',
                args: [`[${useMindMapStore().currentMindMap.value?.name}]`],
            }),
            onConfirm: async () => {
                await useMindMapStore().save();
                resolve(true);
            },
            onCancel: () => {
                resolve(true);
            },
            onClose: () => {
                resolve(false);
            },
        });
    });
};

export const initCloseSave = () =>
    noTauriInvokeSubstitution(
        async () => {
            const appWindow = getCurrentWindow();

            await listen('before-exit', async () => {
                const shouldSave = await useMindMapStore().shouldSave();

                if (shouldSave) {
                    const shouldClose = await confirmSave();
                    await appWindow.emit('confirm-close-response', shouldClose);
                } else {
                    await appWindow.emit('confirm-close-response', true);
                }
            });
        },
        () => {
            const closeHandler = async (event: BeforeUnloadEvent) => {
                const shouldSave = await useMindMapStore().shouldSave();

                if (shouldSave) {
                    event.preventDefault();
                    event.returnValue = '';
                    await confirmSave();
                }
            };

            window.addEventListener('beforeunload', closeHandler);
        },
    );
