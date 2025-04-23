<script setup lang="ts">
import {CommandDefinition, useCommandHistory} from "./history/commandHistory.ts";
import {Handle, Node, Panel, Position, useVueFlow, VueFlow, XYPosition} from "@vue-flow/core"

let nodeId = 0
const nodeType1 = "table" as const

const history = useCommandHistory<{
    "node:add": CommandDefinition<Node, string>,
    "node:move": CommandDefinition<{
        id: string,
        newPosition: XYPosition,
        oldPosition: XYPosition,
    }, {
        id: string,
        oldPosition: XYPosition,
    }>
}>()

history.eventBus.on('beforeChange', ({type, key}) => {
    console.log("beforeChange", type, key)
})

const {addNodes, removeNodes, findNode, updateNode, onNodeDragStart, onNodeDragStop} = useVueFlow("graph-1")

history.registerCommand("node:add", {
    applyAction: (node) => {
        addNodes(node)
        return node.id
    },
    revertAction: (nodeId) => {
        const node = findNode(nodeId)
        if (node !== undefined) {
            removeNodes(nodeId)
            return node
        }
    }
})

history.registerCommand("node:move", {
    applyAction: ({id, newPosition, oldPosition}) => {
        updateNode(id, {
            position: newPosition
        })
        return {
            id,
            oldPosition
        }
    },
    revertAction: ({id, oldPosition}) => {
        updateNode(id, {
            position: oldPosition
        })
    }
})

const addNode = () => {
    history.executeCommand("node:add", {
        id: `node-${nodeId++}`,
        position: {x: 0, y: 0},
        type: nodeType1,
        data: {
            name: "name",
            comment: "comment"
        }
    })
}

const handleKeyDown = (e: KeyboardEvent) => {
    if ((e.key === "z" || e.key === "Z") && e.ctrlKey) {
        if (e.shiftKey) {
            e.preventDefault()
            history.redo()
        } else {
            e.preventDefault()
            history.undo()
        }
    }
}

const nodeMoveMap = new Map<string, XYPosition>

onNodeDragStart(({nodes}) => {
    for (const node of nodes) {
        nodeMoveMap.set(node.id, node.position)
    }
})

onNodeDragStop(({nodes}) => {
    for (const node of nodes) {
        const oldPosition = nodeMoveMap.get(node.id)
        if (oldPosition !== undefined) {
            history.executeCommand('node:move', {id: node.id, newPosition: node.position, oldPosition})
        }
    }
})
</script>

<template>
    <div tabindex="-1" @keydown="handleKeyDown" style="width: 100vw; height: 100vh;">
        <VueFlow id="graph-1">
            <Panel :position="'top-left'">
                <button @click="addNode">name</button>
            </Panel>

            <template #node-table="nodeProps">
                <Handle type="source" :position="Position.Left"/>
                <div>{{ nodeProps.data.name }}</div>
                <div>{{ nodeProps.data.comment }}</div>
                <Handle type="target" :position="Position.Right"/>
            </template>
        </VueFlow>
    </div>
</template>
