import {createStore} from "@/store/createStore.ts";
import {onBeforeUnmount, onMounted, readonly, shallowRef} from "vue";

export const useFocusTargetStore = createStore(() => {
    const focusTarget = shallowRef<EventTarget | Element | null>()
    const setActiveElementByActiveElement = () => {
        focusTarget.value = document.activeElement
    }
    const setActiveElementByFocusIn = (e: Event) => {
        focusTarget.value = e.target
    }
    const cleanActiveElement = () => {
        focusTarget.value = null
    }

    onMounted(() => {
        document.addEventListener('focusin', setActiveElementByFocusIn)
        document.addEventListener('focusout', cleanActiveElement)
        window.addEventListener('resize', setActiveElementByActiveElement)
    })
    onBeforeUnmount(() => {
        document.removeEventListener('focusin', setActiveElementByFocusIn)
        document.removeEventListener('focusout', cleanActiveElement)
        window.removeEventListener('resize', setActiveElementByActiveElement)
        cleanActiveElement()
    })

    return {
        focusTarget: readonly(focusTarget),
    }
})