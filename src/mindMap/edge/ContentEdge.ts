import {type SizePositionEdgePartial} from '@/mindMap/edge/SizePositionEdge.ts';
import {type Edge} from '@vue-flow/core';
import type {JSONSchemaType} from 'ajv/lib/types/json-schema.ts';
import {createSchemaValidator} from '@/utils/type/typeGuard.ts';
import {ContentType_CONSTANTS, type ContentType} from '@/mindMap/ContentType.ts';

// 内容边的边类型
export const EdgeType_CONTENT = 'CONTENT_EDGE' as const;

// 内容边箭头类型（旧字段，仅作向后兼容回退）
export const ContentEdgeArrowType_CONSTANTS = ['one-way', 'two-way', 'none'] as const;
export type ContentEdgeArrowType = (typeof ContentEdgeArrowType_CONSTANTS)[number];

// 内容边两端箭头形状
export const ContentEdgeArrowShape_CONSTANTS = [
    'none',
    'arrow',
    'triangle',
    'diamond',
    'circle',
] as const;
export type ContentEdgeArrowShape = (typeof ContentEdgeArrowShape_CONSTANTS)[number];
export const ContentEdgeArrowShape_DEFAULT: ContentEdgeArrowShape = 'none';

// 内容边线条粗细
export const ContentEdge_strokeWidth_DEFAULT = 2;
export const ContentEdge_strokeWidth_MIN = 1;
export const ContentEdge_strokeWidth_MAX = 10;

// 内容边数据
export type ContentEdgeData = {
    content: string;
    type?: ContentType;
    arrowType?: ContentEdgeArrowType;
    sourceArrow?: ContentEdgeArrowShape;
    targetArrow?: ContentEdgeArrowShape;
    strokeWidth?: number;
    contentSize?: {width: number; height: number};
    color?: string;
    withBorder?: boolean;
    sourceControlPointOffset?: {x: number; y: number};
    targetControlPointOffset?: {x: number; y: number};
} & SizePositionEdgePartial['data'];

// 内容边
export type ContentEdge = Pick<Edge, 'id' | 'source' | 'target' | 'zIndex'> & {
    data: ContentEdgeData;
    type: typeof EdgeType_CONTENT;
    sourceHandle: string;
    targetHandle: string;
};

// 校验内容边
export const ContentEdge_JsonSchema: JSONSchemaType<ContentEdge> = {
    type: 'object',
    required: ['id', 'type', 'source', 'target', 'sourceHandle', 'targetHandle', 'data'],
    properties: {
        id: {type: 'string'},
        type: {type: 'string', enum: ['CONTENT_EDGE']},
        source: {type: 'string'},
        sourceHandle: {type: 'string'},
        target: {type: 'string'},
        targetHandle: {type: 'string'},
        zIndex: {type: 'number', nullable: true},
        data: {
            type: 'object',
            properties: {
                content: {type: 'string'},
                type: {type: 'string', enum: ContentType_CONSTANTS, nullable: true},
                arrowType: {
                    type: 'string',
                    enum: ContentEdgeArrowType_CONSTANTS,
                    nullable: true,
                },
                sourceArrow: {
                    type: 'string',
                    enum: ContentEdgeArrowShape_CONSTANTS,
                    nullable: true,
                },
                targetArrow: {
                    type: 'string',
                    enum: ContentEdgeArrowShape_CONSTANTS,
                    nullable: true,
                },
                strokeWidth: {type: 'number', nullable: true, minimum: 1},
                contentSize: {
                    type: 'object',
                    required: ['width', 'height'],
                    properties: {width: {type: 'number'}, height: {type: 'number'}},
                    nullable: true,
                },
                color: {type: 'string', nullable: true},
                withBorder: {type: 'boolean', nullable: true},

                size: {
                    type: 'object',
                    required: ['width', 'height'],
                    properties: {width: {type: 'number'}, height: {type: 'number'}},
                    nullable: true,
                },
                position: {
                    type: 'object',
                    required: ['top', 'left'],
                    properties: {left: {type: 'number'}, top: {type: 'number'}},
                    nullable: true,
                },

                sourceControlPointOffset: {
                    type: 'object',
                    required: ['x', 'y'],
                    properties: {x: {type: 'number'}, y: {type: 'number'}},
                    nullable: true,
                },
                targetControlPointOffset: {
                    type: 'object',
                    required: ['x', 'y'],
                    properties: {x: {type: 'number'}, y: {type: 'number'}},
                    nullable: true,
                },
            },
            required: ['content'],
        },
    },
};

export const validateContentEdge = createSchemaValidator<ContentEdge>(ContentEdge_JsonSchema);

export const toPureContentEdge = (edge: ContentEdge): ContentEdge => {
    return {
        id: edge.id,
        type: 'CONTENT_EDGE',
        zIndex: edge.zIndex,
        source: edge.source,
        sourceHandle: edge.sourceHandle,
        target: edge.target,
        targetHandle: edge.targetHandle,
        data: {
            content: edge.data.content,
            type: edge.data.type,
            arrowType: edge.data.arrowType,
            sourceArrow: edge.data.sourceArrow,
            targetArrow: edge.data.targetArrow,
            strokeWidth: edge.data.strokeWidth,
            contentSize: edge.data.contentSize,
            color: edge.data.color,
            withBorder: edge.data.withBorder,
            sourceControlPointOffset: edge.data.sourceControlPointOffset,
            targetControlPointOffset: edge.data.targetControlPointOffset,
        },
    };
};
