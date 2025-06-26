import {createSchemaValidator} from "@/utils/type/typeGuard.ts";
import {ContentEdge, ContentNode, MindMapData, SizePositionEdgePartial} from "@/mindMap/useMindMap.ts";
import type {JSONSchemaType} from "ajv/lib/types/json-schema.ts";
import type {MindMapImportData} from "@/mindMap/import/import.ts";

const ContentNode_JsonSchema: JSONSchemaType<ContentNode> = {
    type: "object",
    required: ["id", "type", "position", "data"],
    properties: {
        id: {type: "string"},
        type: {type: "string", enum: ["CONTENT_NODE"]},
        position: {type: "object", properties: {x: {type: "number"}, y: {type: "number"}}, required: ["x", "y"]},
        data: {
            type: "object",
            properties: {
                content: {type: "string"},
                type: {type: "string", enum: ["text", "markdown"], nullable: true},
                color: {type: "string", nullable: true},
                withBorder: {type: "boolean", nullable: true},
            },
            required: ["content"]
        }
    }
}

export const validateContentNode = createSchemaValidator<ContentNode>(ContentNode_JsonSchema)

const ContentEdge_JsonSchema: JSONSchemaType<ContentEdge> = {
    type: "object",
    required: ["id", "type", "source", "target", "sourceHandle", "targetHandle", "data"],
    properties: {
        id: {type: "string"},
        type: {type: "string", enum: ["CONTENT_EDGE"]},
        source: {type: "string"},
        target: {type: "string"},
        sourceHandle: {type: "string"},
        targetHandle: {type: "string"},
        data: {
            type: "object",
            properties: {
                content: {type: "string"},
                arrowType: {
                    type: "string",
                    enum: ["one-way", "two-way", "none"],
                    nullable: true
                },
                color: {type: "string", nullable: true},
                withBorder: {type: "boolean", nullable: true},

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
            },
            required: ["content"]
        }
    }
}

export const validateContentEdge = createSchemaValidator<ContentEdge>(ContentEdge_JsonSchema)

const SizePositionEdgePartial_JsonSchema: JSONSchemaType<SizePositionEdgePartial> = {
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

const MindMapImportData_JsonSchema: JSONSchemaType<MindMapImportData> = {
    type: "object",
    properties: {
        nodes: {type: "array", items: ContentNode_JsonSchema, nullable: true},
        edges: {type: "array", items: ContentEdge_JsonSchema, nullable: true},
    }
}

export const validateMindMapImportData = createSchemaValidator<MindMapImportData>(MindMapImportData_JsonSchema)

const MindMapData_JsonSchema: JSONSchemaType<MindMapData> = {
    type: "object",
    properties: {
        currentLayerId: {
            type: "string"
        },
        layers: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    "id": {
                        type: "string"
                    },
                    "name": {
                        type: "string"
                    },
                    "visible": {
                        type: "boolean"
                    },
                    "opacity": {
                        type: "number"
                    },
                    "data": {
                        type: "object",
                        properties: {
                            nodes: {type: "array", items: ContentNode_JsonSchema},
                            edges: {type: "array", items: ContentEdge_JsonSchema},
                        },
                        required: ["nodes", "edges"]
                    }
                },
                required: ["id", "name", "visible", "opacity", "data"]
            }
        },
        transform: {
            type: "object",
            properties: {
                x: {
                    type: "number"
                },
                y: {
                    type: "number"
                },
                zoom: {
                    type: "number"
                }
            },
            required: ["x", "y", "zoom"]
        },
        zIndexIncrement: {
            type: "number"
        }
    },
    required: ["currentLayerId", "layers", "transform", "zIndexIncrement"]
}

export const validateMindMapData = createSchemaValidator<MindMapData>(MindMapData_JsonSchema)
