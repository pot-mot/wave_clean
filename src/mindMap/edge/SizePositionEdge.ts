// 在data中具有尺寸信息和位置信息的边，需要配合边内部进行监听
import type {JSONSchemaType} from "ajv/lib/types/json-schema.ts";
import {createSchemaValidator} from "@/utils/type/typeGuard.ts";

export type SizePositionEdge = {
    data: {
        position: {
            left: number,
            top: number,
        },
        size: {
            width: number,
            height: number,
        }
    }
}

export type SizePositionEdgePartial = {
    data: Partial<SizePositionEdge["data"]>
}

// 校验具有尺寸信息和位置信息的边
export const SizePositionEdgePartial_JsonSchema: JSONSchemaType<SizePositionEdgePartial> = {
    type: "object",
    required: ["data"],
    properties: {
        data: {
            type: "object",
            properties: {
                size: {
                    type: "object",
                    required: ["width", "height"],
                    properties: {width: {type: "number"}, height: {type: "number"}},
                    nullable: true,
                },
                position: {
                    type: "object",
                    required: ["top", "left"],
                    properties: {left: {type: "number"}, top: {type: "number"}},
                    nullable: true,
                },
            }
        }
    }
}

export const validateSizePositionEdgePartial = createSchemaValidator<SizePositionEdgePartial>(SizePositionEdgePartial_JsonSchema)
