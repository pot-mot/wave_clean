import {onMounted, onUnmounted, readonly, ref} from "vue";
import {createStore} from "@/store/createStore.ts";
import {throttle} from "lodash-es";

export const useDeviceStore = createStore(() => {
    const isTouchDevice = ref('ontouchstart' in window)

    const handleResize = throttle(() => {
        // 通过动态属性修正 vh 在移动端的问题
        if (window.visualViewport) {
            const visualHeight = window.visualViewport.height
            const vh = visualHeight * 0.01
            document.documentElement.style.setProperty('--vh', `${vh}px`)
            document.documentElement.style.setProperty('--visual-viewport-height', `${visualHeight}px`)
        } else {
            const vh = window.innerHeight * 0.01
            document.documentElement.style.setProperty('--vh', `${vh}px`)
        }
    }, 200)

    onMounted(() => {
        handleResize()
        window.addEventListener('resize', handleResize)
    })

    onUnmounted(() => {
        window.removeEventListener('resize', handleResize)
    })

    return {
        isTouchDevice: readonly(isTouchDevice),
    }
})