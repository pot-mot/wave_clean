import type { VNode, DefineComponent } from 'vue'

export type MessageContent = string | (() => VNode) | DefineComponent

export type MessageType = "primary" | "success" | "error" | "warning" | "info"

export type MessageItem = {
    id: number,
    content: MessageContent,
    type: MessageType,
    timeout?: number | undefined,
    canClose: boolean,
}

export type MessageOpenOptions = {
    type: MessageType,
    canClose: boolean,
}

export const messageOpenDefaultOptions: MessageOpenOptions = {
    type: "info",
    canClose: true,
}