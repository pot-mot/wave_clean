import {Connection} from "@vue-flow/core";

export type FullConnection = {
    source: string,
    sourceHandle: string,
    target: string,
    targetHandle: string,
}
export const checkFullConnection = (connection: Connection): connection is FullConnection => {
    if (connection.sourceHandle === null || connection.sourceHandle === undefined) return false
    return !(connection.targetHandle === null || connection.targetHandle === undefined)
}
export const reverseConnection = (connection: Connection): Connection => {
    return {
        source: connection.target,
        sourceHandle: connection.targetHandle,
        target: connection.source,
        targetHandle: connection.sourceHandle,
    }
}
