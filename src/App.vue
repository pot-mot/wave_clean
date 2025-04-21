<script setup lang="ts">
import {CommandDefinition, useCommandHistory} from "./history/commandHistory.ts";
import {reactive} from "vue";

const history = useCommandHistory<{
    changeDataName: CommandDefinition<string>,
    changeDataComment: CommandDefinition<string>,
}>()

history.eventBus.on('beforeChange', ({type, key}) => {
    console.log("beforeChange", type, key)
})

const dataWrapper = reactive({
    data: {
        name: "name",
        comment: "comment"
    }
})

history.registerCommand("changeDataName", {
    applyAction: (newName) => {
        const oldName = dataWrapper.data.name
        dataWrapper.data.name = newName
        return oldName
    },
    revertAction: (oldName) => {
        dataWrapper.data.name = oldName
    }
})

history.registerCommand("changeDataComment", {
    applyAction: (newComment) => {
        const oldComment = dataWrapper.data.comment
        dataWrapper.data.comment = newComment
        return oldComment
    },
    revertAction: (oldComment) => {
        dataWrapper.data.comment = oldComment
    }
})

const changeDataName = () => {
    history.executeCommand("changeDataName", dataWrapper.data.name + "1")
}

const changeDataComment = () => {
    history.executeCommand("changeDataComment", dataWrapper.data.comment + "1")
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
</script>

<template>
    <div tabindex="-1" @keydown="handleKeyDown">
        {{ dataWrapper.data }}
    </div>
    <button @click="changeDataName">name</button>
    <button @click="changeDataComment">comment</button>
</template>
