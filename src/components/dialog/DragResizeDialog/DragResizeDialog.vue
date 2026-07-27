<script lang="ts" setup>
import {computed, nextTick, onBeforeUnmount, reactive, ref, toRaw, watch} from 'vue';
import IconFullScreen from '@/components/icons/IconFullScreen.vue';
import IconClose from '@/components/icons/IconClose.vue';
import {judgeTarget, judgeTargetIsInteraction} from '@/utils/event/judgeEventTarget.ts';
import {useDialogZIndex} from '@/components/dialog/DragResizeDialog/DialogZIndex.ts';

const resizeBorderKeys = ['top', 'left', 'right', 'bottom'] as const;
const resizeHandleKeys = ['top-left', 'top-right', 'bottom-left', 'bottom-right'] as const;
const resizeHandleSize = '8px';
const resizeBorderWidth = '8px';

type DialogSize = {
    width: number;
    height: number;
};

type ClientPosition = {
    clientX: number;
    clientY: number;
};

type ResizeOrigin = ClientPosition & DialogSize;

type ResizeDirection = (typeof resizeBorderKeys)[number] | (typeof resizeHandleKeys)[number];

type ResizeEventArgs = {
    origin: ResizeOrigin;
    direction: ResizeDirection;
    currentSize: DialogSize;
    totalSizeDiff: {x: number; y: number};
    currentSizeDiff: {x: number; y: number};
    totalPositionDiff: {x: number; y: number};
    currentPositionDiff: {x: number; y: number};
};

type ViewportBounds = {
    left: number;
    top: number;
    width: number;
    height: number;
};

const openState = defineModel<boolean>({
    required: true,
});

const props = withDefaults(
    defineProps<{
        to?: HTMLElement | string;
        initX?: number;
        initY?: number;
        initW?: number;
        initH?: number;
        minWidth?: number;
        maxWidth?: number;
        minHeight?: number;
        maxHeight?: number;
        limitByParent?: boolean;
        modal?: boolean;
        canResize?: boolean;
        canDrag?: boolean;
        canFullScreen?: boolean;
        canExitFullScreen?: boolean;
        initFullScreen?: boolean;
    }>(),
    {
        to: 'body',
        canResize: false,
        canDrag: true,
        canFullScreen: true,
        canExitFullScreen: true,
        limitByParent: false,
        modal: false,
    },
);

const emits = defineEmits<{
    (event: 'open'): void;
    (event: 'opened'): void;
    (event: 'close'): void;
    (event: 'closed'): void;
    (event: 'fullScreenToggle'): void;
    (event: 'fullScreenToggled'): void;
}>();

const draggable = ref(props.canDrag);
const resizable = computed(() => props.canResize);

const position = reactive({
    x: 0,
    y: 0,
});
const positionX = computed(() => position.x + 'px');
const positionY = computed(() => position.y + 'px');
const size = ref({
    width: 0,
    height: 0,
});
const sizeStyle = computed(() => ({
    width: `${size.value.width}px`,
    height: `${size.value.height}px`,
}));
const viewportVersion = ref(0);

const clampWidth = (value: number) => {
    let nextValue = value;

    if (props.minWidth !== undefined) {
        nextValue = Math.max(nextValue, props.minWidth);
    }
    if (props.maxWidth !== undefined) {
        nextValue = Math.min(nextValue, props.maxWidth);
    }

    return nextValue;
};

const clampHeight = (value: number) => {
    let nextValue = value;

    if (props.minHeight !== undefined) {
        nextValue = Math.max(nextValue, props.minHeight);
    }
    if (props.maxHeight !== undefined) {
        nextValue = Math.min(nextValue, props.maxHeight);
    }

    return nextValue;
};

watch(
    () => size.value.width,
    (newValue) => {
        const clampedValue = clampWidth(newValue);
        if (clampedValue !== newValue) {
            size.value.width = clampedValue;
        }
    },
    {immediate: true},
);

watch(
    () => size.value.height,
    (newValue) => {
        const clampedValue = clampHeight(newValue);
        if (clampedValue !== newValue) {
            size.value.height = clampedValue;
        }
    },
    {immediate: true},
);

const {zIndex, toFront} = useDialogZIndex();

const getParent = (): HTMLElement | null => {
    let parent: HTMLElement | null;

    const to: string | HTMLElement = toRaw(props.to);

    if (typeof to === 'string') {
        parent = document.querySelector(to);
    } else {
        parent = to;
    }

    return parent;
};

const getViewportBounds = (): ViewportBounds => {
    if (props.limitByParent) {
        const parent = getParent();
        if (parent) {
            return {
                left: 0,
                top: 0,
                width: parent.clientWidth,
                height: parent.clientHeight,
            };
        }
    }

    if (window.visualViewport) {
        return {
            left: window.visualViewport.offsetLeft,
            top: window.visualViewport.offsetTop,
            width: Math.min(window.visualViewport.width, window.innerWidth),
            height: Math.min(window.visualViewport.height, window.innerHeight),
        };
    }

    return {
        left: 0,
        top: 0,
        width: document.documentElement.clientWidth,
        height: document.documentElement.clientHeight,
    };
};

const viewportBounds = computed(() => {
    viewportVersion.value;
    return getViewportBounds();
});

const approximatelyEqual = (a: number, b: number) => Math.abs(a - b) < 1;

const initXW = () => {
    const bounds = getViewportBounds();
    const initW = props.initW ?? bounds.width * 0.8;

    let tempX = position.x;
    let tempW = size.value.width;

    if (bounds.width < initW) {
        tempX = bounds.left;
        tempW = bounds.width;
    } else if (props.initX !== undefined) {
        tempX =
            initW + props.initX > bounds.width
                ? bounds.left + bounds.width - initW
                : bounds.left + props.initX;
        tempW = initW;
    } else {
        tempX = bounds.left + (bounds.width - initW) / 2;
        tempW = initW;
    }

    position.x = tempX;
    size.value.width = tempW;
};

const initYH = () => {
    const bounds = getViewportBounds();
    const initH = props.initH ?? bounds.height * 0.8;

    let tempY = position.y;
    let tempH = size.value.height;

    if (bounds.height < initH) {
        tempY = bounds.top;
        tempH = bounds.height;
    } else if (props.initY !== undefined) {
        tempY = bounds.top + props.initY;
        tempH = initH;
    } else {
        tempY = bounds.top + (bounds.height - initH) / 2;
        tempH = initH;
    }

    position.y = tempY;
    size.value.height = tempH;
};

const isFullScreen = computed<boolean>(() => {
    const bounds = viewportBounds.value;

    return (
        approximatelyEqual(position.x, bounds.left) &&
        approximatelyEqual(position.y, bounds.top) &&
        approximatelyEqual(size.value.height, bounds.height) &&
        approximatelyEqual(size.value.width, bounds.width)
    );
});

watch(
    () => isFullScreen.value,
    (value) => {
        if (value) {
            draggable.value = false;
        } else {
            draggable.value = props.canDrag;
        }
    },
);

const enterFullScreen = () => {
    const bounds = getViewportBounds();

    position.x = bounds.left;
    position.y = bounds.top;
    size.value.height = bounds.height;
    size.value.width = bounds.width;
};

const exitFullScreen = () => {
    initXW();
    initYH();
};

const keepDialogInViewport = () => {
    const bounds = getViewportBounds();

    size.value.width = Math.min(size.value.width, bounds.width);
    size.value.height = Math.min(size.value.height, bounds.height);

    const maxX = bounds.left + bounds.width - size.value.width;
    const maxY = bounds.top + bounds.height - size.value.height;

    position.x = Math.min(Math.max(position.x, bounds.left), Math.max(bounds.left, maxX));
    position.y = Math.min(Math.max(position.y, bounds.top), Math.max(bounds.top, maxY));
};

const handleViewportChange = () => {
    const wasFullScreen = isFullScreen.value;
    viewportVersion.value += 1;

    if (!openState.value) return;

    if (wasFullScreen) {
        enterFullScreen();
    } else {
        keepDialogInViewport();
    }
};

const initSizePosition = () => {
    if (props.canFullScreen && props.initFullScreen) {
        enterFullScreen();
    } else {
        exitFullScreen();
    }
};

const handleOpen = async () => {
    emits('open');

    toFront();
    initSizePosition();

    await nextTick();
    emits('opened');
};

const handleClose = async () => {
    emits('close');

    openState.value = false;

    await nextTick();
    emits('closed');
};

const toggleFullScreen = async () => {
    if (!props.canFullScreen) return;

    emits('fullScreenToggle');

    toFront();

    if (isFullScreen.value) {
        exitFullScreen();
    } else {
        enterFullScreen();
    }

    if (props.limitByParent) {
        await nextTick();
        position.x = -position.x;
        position.y = -position.y;

        await nextTick();
        position.x = -position.x;
        position.y = -position.y;
    }

    emits('fullScreenToggled');
};

watch(
    () => openState.value,
    (value) => {
        if (value) handleOpen();
    },
    {immediate: true},
);

const isResizing = ref(false);
const resizeOrigin = ref<ResizeOrigin>();
const resizeDirection = ref<ResizeDirection>();

let resizeAnimationFrameId: number | undefined;
let pendingResizePosition: ClientPosition | undefined;

const getTouchPosition = (event: TouchEvent) => event.changedTouches[0] ?? event.touches[0];

const getStartResizePosition = (event: MouseEvent | TouchEvent) => {
    if ('touches' in event) {
        return event.touches[0] ?? event.changedTouches[0];
    }

    return event;
};

const applyResizePositionDiff = ({currentPositionDiff}: ResizeEventArgs) => {
    position.x += currentPositionDiff.x;
    position.y += currentPositionDiff.y;
};

const cleanResizeEvent = () => {
    document.removeEventListener('mousemove', scheduleResizeUpdate);
    document.removeEventListener('mouseup', stopResize);
    document.removeEventListener('touchmove', scheduleResizeUpdateByTouch);
    document.removeEventListener('touchend', stopResizeByTouch);
    document.removeEventListener('touchcancel', stopResizeByTouch);
};

const cancelResizeFrame = () => {
    if (resizeAnimationFrameId === undefined) return;

    cancelAnimationFrame(resizeAnimationFrameId);
    resizeAnimationFrameId = undefined;
    pendingResizePosition = undefined;
};

const startResize = (direction: ResizeDirection, event: MouseEvent | TouchEvent) => {
    if (isResizing.value || !resizable.value) return;

    const startPosition = getStartResizePosition(event);
    if (!startPosition) return;

    isResizing.value = true;
    resizeDirection.value = direction;
    resizeOrigin.value = {
        clientX: startPosition.clientX,
        clientY: startPosition.clientY,
        width: size.value.width,
        height: size.value.height,
    };

    if ('touches' in event) {
        document.addEventListener('touchmove', scheduleResizeUpdateByTouch, {passive: false});
        document.addEventListener('touchend', stopResizeByTouch);
        document.addEventListener('touchcancel', stopResizeByTouch);
    } else {
        document.addEventListener('mousemove', scheduleResizeUpdate);
        document.addEventListener('mouseup', stopResize);
    }
};

const handleResizing = (resizePosition: ClientPosition) => {
    if (!isResizing.value || !resizeOrigin.value || !resizeDirection.value) {
        cleanResizeEvent();
        return;
    }

    const dx = resizePosition.clientX - resizeOrigin.value.clientX;
    const dy = resizePosition.clientY - resizeOrigin.value.clientY;

    const previousHeight = size.value.height;
    const previousWidth = size.value.width;
    let currentHeight = previousHeight;
    let currentWidth = previousWidth;

    switch (resizeDirection.value) {
        case 'top':
            currentHeight = resizeOrigin.value.height - dy;
            break;
        case 'left':
            currentWidth = resizeOrigin.value.width - dx;
            break;
        case 'right':
            currentWidth = resizeOrigin.value.width + dx;
            break;
        case 'bottom':
            currentHeight = resizeOrigin.value.height + dy;
            break;

        case 'top-left':
            currentWidth = resizeOrigin.value.width - dx;
            currentHeight = resizeOrigin.value.height - dy;
            break;
        case 'top-right':
            currentWidth = resizeOrigin.value.width + dx;
            currentHeight = resizeOrigin.value.height - dy;
            break;
        case 'bottom-left':
            currentWidth = resizeOrigin.value.width - dx;
            currentHeight = resizeOrigin.value.height + dy;
            break;
        case 'bottom-right':
            currentWidth = resizeOrigin.value.width + dx;
            currentHeight = resizeOrigin.value.height + dy;
            break;
    }

    currentWidth = clampWidth(currentWidth);
    currentHeight = clampHeight(currentHeight);

    size.value.width = currentWidth;
    size.value.height = currentHeight;

    const totalSizeDiff = {
        x: currentWidth - resizeOrigin.value.width,
        y: currentHeight - resizeOrigin.value.height,
    };

    const currentSizeDiff = {
        x: currentWidth - previousWidth,
        y: currentHeight - previousHeight,
    };

    const totalPositionDiff = {x: 0, y: 0};
    const currentPositionDiff = {x: 0, y: 0};

    switch (resizeDirection.value) {
        case 'top':
        case 'top-left':
        case 'top-right':
            totalPositionDiff.y = -totalSizeDiff.y;
            currentPositionDiff.y = -currentSizeDiff.y;
            break;
    }

    switch (resizeDirection.value) {
        case 'left':
        case 'top-left':
        case 'bottom-left':
            totalPositionDiff.x = -totalSizeDiff.x;
            currentPositionDiff.x = -currentSizeDiff.x;
            break;
    }

    applyResizePositionDiff({
        origin: resizeOrigin.value,
        direction: resizeDirection.value,
        currentSize: {
            width: currentWidth,
            height: currentHeight,
        },
        totalSizeDiff,
        currentSizeDiff,
        totalPositionDiff,
        currentPositionDiff,
    });

    window.getSelection()?.removeAllRanges();
};

const scheduleResizeUpdate = (resizePosition: ClientPosition) => {
    if (!isResizing.value || !resizeOrigin.value || !resizeDirection.value) {
        cleanResizeEvent();
        return;
    }

    pendingResizePosition = resizePosition;

    if (resizeAnimationFrameId === undefined) {
        resizeAnimationFrameId = requestAnimationFrame(() => {
            if (pendingResizePosition) {
                handleResizing(pendingResizePosition);
            }
            pendingResizePosition = undefined;
            resizeAnimationFrameId = undefined;
        });
    }
};

const scheduleResizeUpdateByTouch = (event: TouchEvent) => {
    if (event.cancelable) {
        event.preventDefault();
    }

    const touch = getTouchPosition(event);
    if (!touch) return;
    scheduleResizeUpdate(touch);
};

const stopResize = (resizePosition: ClientPosition) => {
    if (!isResizing.value || !resizeOrigin.value || !resizeDirection.value) {
        cleanResizeEvent();
        return;
    }

    cancelResizeFrame();
    handleResizing(resizePosition);
    isResizing.value = false;
    cleanResizeEvent();
    resizeDirection.value = undefined;
    resizeOrigin.value = undefined;
};

const stopResizeByTouch = (event: TouchEvent) => {
    const touch = getTouchPosition(event);
    if (!touch) return;
    stopResize(touch);
};

const stopResizePointerDown = () => undefined;

const isResizeControlTarget = (event: UIEvent) =>
    judgeTarget(
        event,
        (el) => el.classList.contains('resize-border') || el.classList.contains('resize-handle'),
    );

const canDragFromEvent = (event: UIEvent, headerOnly = false) => {
    if (!props.canDrag || isFullScreen.value) return false;

    if (judgeTargetIsInteraction(event)) return false;

    if (isResizeControlTarget(event)) return false;

    if (judgeTarget(event, (el) => el.classList.contains('no-drag'))) return false;

    if (headerOnly) {
        return judgeTarget(event, (el) => el.classList.contains('dialog-header'));
    }

    return true;
};

const handleInnerOver = (e: PointerEvent) => {
    if (!props.canDrag) {
        draggable.value = false;
        return;
    }

    if (isFullScreen.value) {
        return;
    }

    draggable.value = canDragFromEvent(e);
};

const handleInnerLeave = () => {
    if (!props.canDrag) {
        draggable.value = false;
        return;
    }

    if (isFullScreen.value) {
        return;
    }

    draggable.value = true;
};

const isDragging = ref(false);
let initX = 0;
let initY = 0;

const onDragStart = (event: PointerEvent) => {
    if (isResizing.value || isDragging.value) return;

    if (event.pointerType === 'mouse' && event.button !== 0) return;

    if (!canDragFromEvent(event, event.pointerType !== 'mouse')) return;

    event.preventDefault();

    isDragging.value = true;
    initX = position.x - event.clientX;
    initY = position.y - event.clientY;
    toFront();
    document.documentElement.addEventListener('pointermove', onDragMove, {passive: false});
    document.documentElement.addEventListener('pointerup', onDragEnd);
    document.documentElement.addEventListener('pointercancel', onDragEnd);
};

const onDragMove = (event: PointerEvent) => {
    if (!props.canDrag || isFullScreen.value) {
        onDragEnd();
        return;
    }

    if (isDragging.value) {
        event.preventDefault();

        position.x = initX + event.clientX;
        position.y = initY + event.clientY;

        window.getSelection()?.removeAllRanges();
    }
};

const onDragEnd = () => {
    isDragging.value = false;
    initX = 0;
    initY = 0;
    document.documentElement.removeEventListener('pointermove', onDragMove);
    document.documentElement.removeEventListener('pointerup', onDragEnd);
    document.documentElement.removeEventListener('pointercancel', onDragEnd);
};

const cleanDialogInteraction = () => {
    cleanResizeEvent();
    cancelResizeFrame();
    isResizing.value = false;
    resizeDirection.value = undefined;
    resizeOrigin.value = undefined;
    onDragEnd();
};

window.visualViewport?.addEventListener('resize', handleViewportChange);
window.visualViewport?.addEventListener('scroll', handleViewportChange);
window.addEventListener('resize', handleViewportChange);

watch(
    () => openState.value,
    (value) => {
        if (!value) {
            cleanDialogInteraction();
        }
    },
);

onBeforeUnmount(() => {
    window.visualViewport?.removeEventListener('resize', handleViewportChange);
    window.visualViewport?.removeEventListener('scroll', handleViewportChange);
    window.removeEventListener('resize', handleViewportChange);
    cleanDialogInteraction();
});
</script>

<template>
    <Teleport to="body">
        <template v-if="openState">
            <div
                v-if="modal"
                class="modal"
            >
                <slot name="modal">
                    <div class="modal-content" />
                </slot>
            </div>

            <div
                class="dialog"
                :class="{'full-screen': isFullScreen}"
                :style="sizeStyle"
                @pointerdown="onDragStart"
                @pointerover="handleInnerOver"
                @pointerleave="handleInnerLeave"
            >
                <div class="dialog-header">
                    <div>
                        <slot name="title" />
                    </div>
                    <div>
                        <button
                            class="toggle-full-screen"
                            @click="toggleFullScreen"
                            v-if="canFullScreen && canExitFullScreen"
                        >
                            <IconFullScreen />
                        </button>
                        <button
                            class="close"
                            @click="handleClose"
                        >
                            <IconClose />
                        </button>
                    </div>
                </div>

                <div class="dialog-content">
                    <slot />
                </div>

                <template v-if="resizable">
                    <div
                        v-for="key of resizeBorderKeys"
                        :key="key"
                        :class="['resize-border', key]"
                        @pointerdown.capture.stop="stopResizePointerDown"
                        @mousedown.capture.stop.prevent="startResize(key, $event)"
                        @touchstart.capture.stop.passive="startResize(key, $event)"
                    />

                    <div
                        v-for="key of resizeHandleKeys"
                        :key="key"
                        :class="['resize-handle', key]"
                        @pointerdown.capture.stop="stopResizePointerDown"
                        @mousedown.capture.stop.prevent="startResize(key, $event)"
                        @touchstart.capture.stop.passive="startResize(key, $event)"
                    />
                </template>
            </div>
        </template>
    </Teleport>
</template>

<style scoped>
.dialog {
    position: absolute;
    left: v-bind(positionX);
    top: v-bind(positionY);
    z-index: v-bind(zIndex);
    --resize-handle-size: v-bind(resizeHandleSize);
    --resize-border-width: v-bind(resizeBorderWidth);
    border: var(--border);
    border-color: var(--border-color-light);
    border-radius: var(--border-radius);
    background-color: var(--background-color);
    overflow: hidden;
    will-change: width, height;
}

.dialog.full-screen {
    border: none;
}

.dialog-header {
    display: flex;
    justify-content: space-between;
    height: 2rem;
    line-height: 2rem;
    padding-left: 0.5rem;
    touch-action: none;
    user-select: none;
}

.dialog-header button {
    border: none;
    cursor: pointer;
    padding: 0.5rem;
    height: 2rem;
}

.dialog-header button > svg {
    vertical-align: top;
}

.dialog-header button.toggle-full-screen:hover {
    background-color: var(--background-color-hover);
}

.dialog-header button.close:hover {
    background-color: var(--danger-color);
    --icon-color: #fff;
}

.dialog-content {
    height: calc(100% - 2rem);
    width: 100%;
    overflow: auto;
    overscroll-behavior: contain;
    -webkit-overflow-scrolling: touch;
}

.modal {
    position: fixed;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: v-bind(zIndex);
}

.modal-content {
    height: 100%;
    width: 100%;
    background-color: var(--mask-color);
}

.resize-border {
    position: absolute;
    z-index: 1;
    width: var(--resize-border-width);
    height: var(--resize-border-width);
    background-color: transparent;
    touch-action: none;
}

.resize-border.top {
    top: calc(var(--resize-border-width) * -1 / 2);
    left: 50%;
    width: calc(100% - var(--resize-handle-size));
    transform: translateX(-50%);
    cursor: n-resize;
}

.resize-border.left {
    top: 50%;
    left: calc(var(--resize-border-width) * -1 / 2);
    height: calc(100% - var(--resize-handle-size));
    transform: translateY(-50%);
    cursor: w-resize;
}

.resize-border.right {
    top: 50%;
    right: calc(var(--resize-border-width) * -1 / 2);
    height: calc(100% - var(--resize-handle-size));
    transform: translateY(-50%);
    cursor: e-resize;
}

.resize-border.bottom {
    bottom: calc(var(--resize-border-width) * -1 / 2);
    left: 50%;
    width: calc(100% - var(--resize-handle-size));
    transform: translateX(-50%);
    cursor: s-resize;
}

.resize-handle {
    position: absolute;
    z-index: 1;
    width: var(--resize-handle-size);
    height: var(--resize-handle-size);
    background-color: transparent;
    touch-action: none;
}

.resize-handle.top-left {
    top: calc(var(--resize-handle-size) * -1 / 2);
    left: calc(var(--resize-handle-size) * -1 / 2);
    cursor: nw-resize;
}

.resize-handle.top-right {
    top: calc(var(--resize-handle-size) * -1 / 2);
    right: calc(var(--resize-handle-size) * -1 / 2);
    cursor: ne-resize;
}

.resize-handle.bottom-left {
    bottom: calc(var(--resize-handle-size) * -1 / 2);
    left: calc(var(--resize-handle-size) * -1 / 2);
    cursor: sw-resize;
}

.resize-handle.bottom-right {
    right: calc(var(--resize-handle-size) * -1 / 2);
    bottom: calc(var(--resize-handle-size) * -1 / 2);
    cursor: se-resize;
}
</style>
