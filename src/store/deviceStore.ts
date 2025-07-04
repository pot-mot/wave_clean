import {readonly, ref} from "vue";
import {createStore} from "@/store/createStore.ts";

export const useDeviceStore = createStore(() => {
    const isTouchDevice = ref('ontouchstart' in document.documentElement)

    return {
        isTouchDevice: readonly(isTouchDevice),
    }
})