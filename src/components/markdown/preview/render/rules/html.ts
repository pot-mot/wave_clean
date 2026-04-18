import {createVNode, Fragment, type VNode} from 'vue';

const parser = new DOMParser();

export const createHtmlVNode = (html: string): VNode => {
    const elements = parser.parseFromString(html, 'text/html').body.children;
    const children: VNode[] = [];
    for (let i = 0; i < elements.length; i++) {
        const element = elements[i];
        if (!element) continue;
        const tagName = element.tagName.toLowerCase();
        const attrs: Record<string, any> = {
            key: element.outerHTML,
        };

        for (let j = 0; j < element.attributes.length; j++) {
            const attr = element.attributes[j];
            if (!attr) continue;
            attrs[attr.name] = attr.value;
        }

        attrs.innerHTML = element.innerHTML;
        attrs.key = element.innerHTML;

        children.push(createVNode(tagName, attrs, []));
    }

    return createVNode(Fragment, {}, children);
};
