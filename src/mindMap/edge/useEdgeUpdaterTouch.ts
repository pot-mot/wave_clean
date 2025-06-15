import {mapTouchToMouseEvents} from "@/event/mapTouchToMouseEvent.ts";
import {onMounted} from "vue";
import {useDeviceStore} from "@/store/deviceStore.ts";

export const useEdgeUpdaterTouch = (
    edgeId: string
): void => {
    onMounted(() => {
        const {isTouchDevice} = useDeviceStore()
        if (!isTouchDevice.value) return

        const edgeEl = document.querySelector(`g[data-id="${edgeId}"]`)
        if (edgeEl !== null) {
            const updaters = edgeEl.querySelectorAll("circle.vue-flow__edgeupdater")
            for (const updater of updaters) {
                mapTouchToMouseEvents(updater)
            }
        }
    })
}