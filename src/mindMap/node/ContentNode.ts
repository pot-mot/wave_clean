import {type GraphNode, type Position} from "@vue-flow/core";
import type {JSONSchemaType} from "ajv/lib/types/json-schema.ts";
import {createSchemaValidator} from "@/utils/type/typeGuard.ts";

// 内容节点的节点类型
export const NodeType_CONTENT = "CONTENT_NODE" as const

// 内容类型
export const ContentType_CONSTANTS = ["text", "markdown"] as const
export type ContentType = typeof ContentType_CONSTANTS[number]

export const ContentType_DEFAULT = ContentType_CONSTANTS[0]

export const ContentNode_Markdown_initWidth = 240
export const ContentNode_Markdown_initHeight = 160

export const ContentNode_Markdown_minWidth = 24
export const ContentNode_Markdown_minHeight = 24

// 内容节点数据
export type ContentNodeData = {
    content: string,
    type?: ContentType,
    color?: string,
    withBorder?: boolean,
}

// 内容节点
export type ContentNode = Pick<GraphNode, 'id' | 'position'> & {
    data: ContentNodeData,
    type: typeof NodeType_CONTENT,
    dimensions?: {
        width: number,
        height: number,
    } | null | undefined
}

// 内容节点具有的全部连接柄
export const ContentNodeHandles: Position[] = [Position.Left, Position.Right, Position.Top, Position.Bottom] as const

// 校验内容边
export const ContentNode_JsonSchema: JSONSchemaType<ContentNode> = {
    type: "object",
    required: ["id", "type", "position", "data"],
    properties: {
        id: {type: "string"},
        type: {type: "string", enum: ["CONTENT_NODE"]},
        position: {
            type: "object",
            required: ["x", "y"],
            properties: {x: {type: "number"}, y: {type: "number"}},
        },
        dimensions: {
            type: "object",
            required: ["width", "height"],
            properties: {width: {type: "number"}, height: {type: "number"}},
            nullable: true,
        },
        data: {
            type: "object",
            properties: {
                content: {type: "string"},
                type: {type: "string", enum: ContentType_CONSTANTS, nullable: true},
                color: {type: "string", nullable: true},
                withBorder: {type: "boolean", nullable: true},
            },
            required: ["content"]
        }
    }
}

export const validateContentNode = createSchemaValidator<ContentNode>(ContentNode_JsonSchema)
