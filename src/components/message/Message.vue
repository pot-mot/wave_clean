<template>
    <div class="message-container">
        <TransitionGroup
            tag="div"
            name="messages"
            style="position: relative;"
            :duration="{enter: enterDuration, leave: leaveDuration}"
            @after-leave="handleAfterLeave"
        >
            <div
                v-for="(item, index) in messageItems"
                :key="item.id"
                class="message-wrapper"
                :ref="el => initSize(el)"
            >
                <div
                    class="message" :class="item.type"
                    @mouseenter="handleMouseEnter(item)"
                    @mouseleave="handleMouseLeave(item)"
                >
                    <Component v-if="typeof item.content !== 'string'" :is="item.content"/>
                    <span v-else>{{ item.content }}</span>
                    <span v-if="item.canClose" class="close-icon" @click="close(index)">
                        <IconClose/>
                    </span>
                </div>
            </div>
        </TransitionGroup>
    </div>
</template>

<script setup lang="ts">
import {ref} from "vue";
import IconClose from "@/components/icons/IconClose.vue";
import {
    MessageContent,
    MessageItem,
    messageOpenDefaultOptions,
    MessageOpenOptions,
} from "@/components/message/MessageItem.ts";

const props = withDefaults(defineProps<{
    timeout?: number,
    enterDuration?: number,
    leaveDuration?: number,
}>(), {
    timeout: 3000,
    enterDuration: 500,
    leaveDuration: 1000,
})

const emits = defineEmits<{
    (event: "close", index: number): void,
    (event: "closeAll"): void
}>()

let messageItemIdIncrement = 0

const messageItems = ref<MessageItem[]>([])

const setMessageItemTimeout = (messageItem: MessageItem) => {
    if (messageItem.timeout) {
        clearTimeout(messageItem.timeout)
    }

    messageItem.timeout = setTimeout(() => {
        const index = messageItems.value.findIndex(it => it.id === messageItem.id)
        if (index === -1) return
        messageItems.value.splice(index, 1)
        setTimeout(() => {
            emits("close", index)
        }, props.leaveDuration)
    }, props.timeout + props.enterDuration)
}

const open = (
    content: MessageContent,
    options?: Partial<MessageOpenOptions>
) => {
    const {
        type,
        canClose
    } = Object.assign({}, options, messageOpenDefaultOptions)
    const messageItem: MessageItem = {id: ++messageItemIdIncrement, content, type, canClose}
    setMessageItemTimeout(messageItem)
    messageItems.value.push(messageItem)
}

const initSize = (el: Element | any | null) => {
    if (!el) return
    if (el instanceof HTMLElement && !el.style.width) {
        el.style.width = el.scrollWidth + 'px'
        el.style.height = el.scrollHeight + 'px'
    }
}

const handleMouseEnter = (messageItem: MessageItem) => {
    clearTimeout(messageItem.timeout)
}

const handleMouseLeave = (messageItem: MessageItem) => {
    setMessageItemTimeout(messageItem)
}

const close = (index: number) => {
    const removedMessages = messageItems.value.splice(index, 1)
    for (const message of removedMessages) {
        clearTimeout(message.timeout)
    }
    setTimeout(() => {
        emits("close", index)
    }, props.leaveDuration)
}

const handleAfterLeave = () => {
    if (messageItems.value.length === 0) {
        setTimeout(() => {
            if (messageItems.value.length === 0) {
                emits("closeAll")
            }
        }, props.leaveDuration)
    }
}

defineExpose({
    open
})
</script>

<style scoped>
.message-container {
    position: fixed;
    top: 1.5rem;
    width: 100%;
    margin: auto;
    pointer-events: none;
    z-index: var(--top-z-index);
}

.message-wrapper {
    width: 100%;
    margin-bottom: 0.5rem;
}

.message {
    height: fit-content;
    width: fit-content;
    margin: auto;
    padding: 0.2rem 1rem;
    text-align: center;
    font-size: 1rem;
    background-color: var(--background-color);
    border: var(--border);
    border-radius: var(--border-radius);
    pointer-events: all;
    max-width: 80%;
    overflow: auto;
}

.message.primary {
    color: var(--primary-color);
    border-color: var(--primary-color);
}

.message.success {
    color: var(--success-color);
    border-color: var(--success-color);
}

.message.error {
    color: var(--danger-color);
    border-color: var(--danger-color);
}

.message.warning {
    color: var(--warning-color);
    border-color: var(--warning-color);
}

.message.info {
    color: var(--comment-color);
    border-color: var(--comment-color);
}

.close-icon {
    width: 1rem;
    height: 1rem;
    line-height: 1rem;
    margin-left: 0.6rem;
    font-size: 1rem;
    cursor: pointer;
}

/* messages 过渡动画 */
.messages-enter-from,
.messages-leave-to {
    opacity: 0;
    transform: translateY(-200%);
}

.messages-enter-active {
    transition: opacity v-bind(enterDuration+ 'ms') ease, transform v-bind(enterDuration+ 'ms') ease;
}

.messages-move,
.messages-leave-active {
    transition: opacity v-bind(leaveDuration+ 'ms') ease, transform v-bind(enterDuration+ 'ms') linear;
    pointer-events: none;
}

.messages-leave-active {
    position: absolute;
}
</style>
