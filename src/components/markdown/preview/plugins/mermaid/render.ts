import mermaid, {type MermaidConfig} from 'mermaid';
import type {Theme} from '@tauri-apps/api/window';
import {v7 as uuid} from 'uuid';

export const defaultOptions: MermaidConfig = {
    startOnLoad: false,
    flowchart: {
        htmlLabels: true,
    },
};

mermaid.initialize(defaultOptions);

const cache = new Map<string, string>();

export const cleanMermaidCache = () => {
    cache.clear();
};

export const setMermaidTheme = (newTheme: Theme) => {
    mermaid.initialize({
        ...defaultOptions,
        theme: newTheme === 'dark' ? 'dark' : 'default',
    });
};

export const renderMermaid = async (rawCode: string) => {
    let rendered = cache.get(rawCode);
    if (rendered === undefined) {
        const renderId = `rendering-${uuid()}`;
        const renderElement = document.createElement('div');
        renderElement.id = renderId;
        const result = await mermaid.render(renderId, rawCode);
        renderElement.remove();
        rendered = result.svg;
        cache.set(rawCode, rendered);
    }
    return rendered;
};
