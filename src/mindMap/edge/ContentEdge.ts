import {type SizePositionEdgePartial} from '@/mindMap/edge/SizePositionEdge.ts';
import {type Edge} from '@vue-flow/core';
import type {JSONSchemaType} from 'ajv/lib/types/json-schema.ts';
import {createSchemaValidator} from '@/utils/type/typeGuard.ts';

// 内容边的边类型
export const EdgeType_CONTENT = 'CONTENT_EDGE' as const;

// 内容边箭头类型
export const ContentEdgeArrowType_CONSTANTS = ['one-way', 'two-way', 'none'] as const;
export type ContentEdgeArrowType = (typeof ContentEdgeArrowType_CONSTANTS)[number];

// 内容边数据
export type ContentEdgeData = {
    content: string;
    arrowType?: ContentEdgeArrowType;
    color?: string;
    withBorder?: boolean;
    sourceControlPointOffset?: {x: number; y: number};
    targetControlPointOffset?: {x: number; y: number};
} & SizePositionEdgePartial['data'];

// 内容边
export type ContentEdge = Pick<Edge, 'id' | 'source' | 'target'> & {
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
        target: {type: 'string'},
        sourceHandle: {type: 'string'},
        targetHandle: {type: 'string'},
        data: {
            type: 'object',
            properties: {
                content: {type: 'string'},
                arrowType: {
                    type: 'string',
                    enum: ContentEdgeArrowType_CONSTANTS,
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
        source: edge.source,
        sourceHandle: edge.sourceHandle,
        target: edge.target,
        targetHandle: edge.targetHandle,
        data: {
            content: edge.data.content,
            arrowType: edge.data.arrowType,
            color: edge.data.color,
            withBorder: edge.data.withBorder,
            sourceControlPointOffset: edge.data.sourceControlPointOffset,
            targetControlPointOffset: edge.data.targetControlPointOffset,
        },
    };
};
