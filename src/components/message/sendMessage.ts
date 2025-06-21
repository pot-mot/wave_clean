import {createApp} from "vue";
import Message from "@/components/message/Message.vue";

type MessageInstance = InstanceType<typeof Message>
let newInstance: MessageInstance | null = null

export const sendMessage = (message: string) => {
    if (newInstance === null) {
        const el = document.createElement("div");
        const app = createApp(Message, {
            onCloseAll: () => {
                app.unmount();
                el.remove();
                newInstance = null;
            }
        })
        newInstance = app.mount(el) as MessageInstance;
        document.body.appendChild(el);
        newInstance.open(message);
    } else {
        newInstance.open(message);
    }
}
