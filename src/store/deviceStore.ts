import {onMounted, onUnmounted, readonly, ref} from "vue";
import {createStore} from "@/store/createStore.ts";
import {debounce, throttle} from "lodash-es";

export const useDeviceStore = createStore(() => {
    const isTouchDevice = ref('ontouchstart' in window)

    const syncVisualHeight = debounce(() => {
        if (window.visualViewport) {
            document.documentElement.style.setProperty('--visual-viewport-height', `${window.visualViewport.height}px`)
        }
    }, 200)

    const handleResize = throttle(() => {
        // 通过动态属性修正 vh 在移动端的问题
        const vh = window.innerHeight * 0.01
        document.documentElement.style.setProperty('--vh', `${vh}px`)
    }, 200)

    onMounted(() => {
        handleResize()
        syncVisualHeight()
        window.addEventListener('resize', handleResize)
        window.visualViewport?.addEventListener('resize', syncVisualHeight)
    })

    onUnmounted(() => {
        window.removeEventListener('resize', handleResize)
        window.visualViewport?.removeEventListener('resize', syncVisualHeight)
    })

    return {
        isTouchDevice: readonly(isTouchDevice),
    }
})