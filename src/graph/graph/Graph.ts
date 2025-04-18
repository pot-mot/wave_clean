import {GNode} from "@/graph/node/GNode.ts";
import {GEdge} from "@/graph/edge/GEdge.ts";
import {GPort} from "@/graph/port/GPort.ts";
import {createSelection, GSelection} from "@/graph/selection/GSelection.ts";
import {Point, RectSize} from "@/graph/baseType/Shape.ts";
import {debounce} from "lodash";
import {DeepReadonly} from "vue";
import {CommandHistory, useCommandHistory} from "@/history/commandHistory.ts";
import {localToPage, pageToLocal} from "@/graph/graph/pointPosition.ts";
import {GraphEvents} from "@/graph/graph/graphEvents.ts";
import mitt, {Emitter} from "mitt";

type GraphHistoryCommandMap = {}

export type Graph = DeepReadonly<
    {
        el: HTMLElement,
        svg: SVGSVGElement,
        viewport: SVGGElement,

        scale: number,
        setScale: (newScale: number) => void,
        translate: Point,
        setTranslate: (newTranslate: Point) => void,

        mouseClientPosition: Point,
        mouseLocalPosition: Point,
        size: RectSize,

        isDragging: boolean,

        nodes: GSelection<GNode<any>>,
        edges: GSelection<GEdge<any>>,
        ports: GSelection<GPort<any>>,

        history: CommandHistory<GraphHistoryCommandMap>,
    } &
    Pick<Emitter<GraphEvents>, 'on' | 'off'>
>

export const createGraph = (el: HTMLElement): Graph => {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg")
    const viewport = document.createElementNS("http://www.w3.org/2000/svg", "g")
    svg.appendChild(viewport)

    const history = useCommandHistory<GraphHistoryCommandMap>()
    const eventBus = mitt<GraphEvents>()

    let size: RectSize = {width: 0, height: 0}
    let mouseClientPosition = {x: 0, y: 0}
    let mouseLocalPosition = {x: 0, y: 0}
    const setMousePosition = (e: MouseEvent) => {
        mouseClientPosition = {x: e.clientX, y: e.clientY}
        mouseLocalPosition = pageToLocal(mouseClientPosition, {scale, translate})
    }

    let translate: Point = {x: 0, y: 0}

    let scale: number = 1
    const minScale: number = 0.025
    const maxScale: number = 16

    /**
     * 设置视口位移
     */
    const setTranslate = (newTranslate: Point) => {
        const previousTranslate = translate
        translate = newTranslate
        syncTransform()
        eventBus.emit("translate:change", {translate, previousTranslate})
    }

    /**
     * 设置视口缩放，将保持视口中心不变
     */
    const setScale = async (_newScale: number) => {
        const previousScale = scale
        const oldLocal = {scale: previousScale, translate}

        const newScale = Math.max(minScale, Math.min(maxScale, _newScale))
        const ratio = newScale / scale
        scale = newScale

        const leftTop = localToPage({x: 0, y: 0}, oldLocal)
        const center = {x:  window.innerWidth / 2, y: window.innerHeight / 2}

        const dx = (leftTop.x - center.x) * (ratio - 1)
        const dy = (leftTop.y - center.y) * (ratio - 1)
        const previousTranslate = translate
        translate = {x: translate.x + dx, y: translate.y + dy}

        syncTransform()
        eventBus.emit("scale:change", {scale, previousScale})
        eventBus.emit("translate:change", {translate, previousTranslate})
    }

    const setSize = ({width, height}: RectSize) => {
        size = {width, height}

        svg.setAttribute("width", width.toString())
        svg.setAttribute("height", height.toString())
    }

    let isDragging: boolean = false

    const syncSize = () => {
        setSize({width: el.clientWidth, height: el.clientHeight})
    }
    syncSize()

    const syncTransform = () => {
        viewport.setAttribute("transform", `translate(${translate.x},${translate.y}) scale(${scale})`)
    }
    syncTransform()

    const resizeOb = new ResizeObserver(debounce(() => {
        syncSize()
        syncTransform()
    }, 200))
    resizeOb.observe(el)

    const onMouseDown = (e: MouseEvent) => {
        isDragging = true
        setMousePosition(e)
    }

    const onMouseMove = (e: MouseEvent) => {
        if (isDragging) {
            const dx = e.clientX - mouseClientPosition.x
            const dy = e.clientY - mouseClientPosition.y

            setTranslate({x: translate.x + dx, y: translate.y + dy})
        }
        setMousePosition(e)
    }

    const onMouseUp = (e: MouseEvent) => {
        if (isDragging) {
            isDragging = false
        }
        setMousePosition(e)
    }

    const onWheel = async (e: WheelEvent) => {
        e.preventDefault()

        const delta = e.deltaY < 0 ? 1.1 : 0.9
        await setScale(scale * delta)
    }

    el.addEventListener("mousedown", onMouseDown)
    el.addEventListener("wheel", onWheel)
    document.addEventListener("mousemove", onMouseMove)
    document.addEventListener("mouseup", onMouseUp)

    const nodes = createSelection<GNode<any>>()
    const edges = createSelection<GEdge<any>>()
    const ports = createSelection<GPort<any>>()

    el.appendChild(svg)

    return {
        el,
        svg,
        viewport,

        scale,
        setScale,
        translate,
        setTranslate,

        mouseClientPosition,
        mouseLocalPosition,
        size,
        isDragging,

        nodes,
        edges,
        ports,

        history,

        on: eventBus.on,
        off: eventBus.off,
    }
}
