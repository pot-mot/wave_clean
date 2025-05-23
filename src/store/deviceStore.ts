import {readonly, ref} from "vue";

const initDeviceStore = () => {
    const isTouchDevice = ref('ontouchstart' in document.documentElement)

    return {
        isTouchDevice: readonly(isTouchDevice),
    }
}

type DeviceStore = ReturnType<typeof initDeviceStore>

let deviceStore: DeviceStore | undefined

export const useDeviceStore = (): DeviceStore => {
    if (deviceStore === undefined) {
        deviceStore = initDeviceStore()
    }
    return deviceStore
}