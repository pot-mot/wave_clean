import {mapTouchToMouseEvents} from "@/mindMap/touchToMouse/mapTouchToMouseEvent.ts";
import {onMounted} from "vue";
import {useMindMap} from "@/mindMap/useMindMap.ts";

export const useEdgeUpdaterTouch = (
    edgeId: string
): void => {
    onMounted(() => {
        const {isTouchDevice} = useMindMap()
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