// 内容类型（node 和 edge 共享）
export const ContentType_CONSTANTS = ['text', 'markdown'] as const;
export type ContentType = (typeof ContentType_CONSTANTS)[number];

export const ContentType_DEFAULT = ContentType_CONSTANTS[0];

// 内容（节点/边）内容框的最小尺寸
export const Content_minWidth = 20;
export const Content_minHeight = 24;
