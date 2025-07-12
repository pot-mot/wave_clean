export const noTauriInvokeSubstitution = async <R> (
    tauriAction: () => Promise<R>,
    substituteAction: () => Promise<R>,
) => {
    try {
        return await tauriAction()
    } catch (e) {
        if (e instanceof Error && e.message === "Cannot read properties of undefined (reading 'invoke')") {
            return await substituteAction()
        } else {
            throw e
        }
    }
}