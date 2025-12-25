export type QuickInputItem = {
    id: string,
    label: string,
    value: string,
}

export const getDefaultQuickInputs = () => {
    let index = -1
    return [
        {id: `${index--}`, label: 'TAB', value: '    '},
        {id: `${index--}`, label: '`', value: '`'},
        {id: `${index--}`, label: '\'', value: '\''},
        {id: `${index--}`, label: '"', value: '"'},
        {id: `${index--}`, label: '-', value: '-'},
        {id: `${index--}`, label: '_', value: '_'},
        {id: `${index--}`, label: '=', value: '='},
        {id: `${index--}`, label: '<', value: '<'},
        {id: `${index--}`, label: '>', value: '>'},
        {id: `${index--}`, label: '(', value: '('},
        {id: `${index--}`, label: ')', value: ')'},
        {id: `${index--}`, label: '[', value: '['},
        {id: `${index--}`, label: ']', value: ']'},
        {id: `${index--}`, label: '[', value: '['},
        {id: `${index--}`, label: ']', value: ']'},
        {id: `${index--}`, label: '{', value: '{'},
        {id: `${index--}`, label: '}', value: '}'},
        {id: `${index--}`, label: '^', value: '^'},
        {id: `${index--}`, label: '/', value: '/'},
        {id: `${index--}`, label: '|', value: '|'},
        {id: `${index--}`, label: '\\', value: '\\'},
    ]
}