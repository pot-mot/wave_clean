import {onMounted, onUnmounted, readonly, ref} from "vue";
import {createStore} from "@/store/createStore.ts";
import {throttle} from "lodash-es";

export const useDeviceStore = createStore(() => {
    const isTouchDevice = ref('ontouchstart' in window)
    const visualHeight = ref(window.innerHeight)

    const handleResize = throttle(() => {
        // 通过动态属性修正 vh 在移动端的问题
        if (window.visualViewport) {
            visualHeight.value = Math.min(window.visualViewport.height, window.innerHeight)
        } else {
            visualHeight.value = window.innerHeight
        }
        const vh = visualHeight.value * 0.01
        document.documentElement.style.setProperty('--vh', `${vh}px`)
        document.documentElement.style.setProperty('--visual-height', `${visualHeight.value}px`)
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
        visualHeight: readonly(visualHeight),
    }
})