export const noTauriInvokeSubstitution = async <R> (
    tauriAction: () => (R | Promise<R>),
    substituteAction: () => (R | Promise<R>),
): Promise<R> => {
    if (!import.meta.env.VITE_TARGET_RUNTIME || import.meta.env.VITE_TARGET_RUNTIME === 'tauri') {
        return await tauriAction()
    } else {
        return await substituteAction()
    }
}