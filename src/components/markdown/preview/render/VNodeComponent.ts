import {defineComponent, type PropType, type VNode} from 'vue';

export const VNodeComponent = defineComponent({
    props: {
        content: {
            type: Array as PropType<VNode[]>,
            required: true,
        },
    },
    render() {
        return this.content;
    },
});
