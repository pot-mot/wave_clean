import MarkdownIt from "markdown-it";

export const MarkdownItLink = (md: MarkdownIt) => {
    // @ts-ignore
    const defaultRender = (tokens, idx, options, env, self) => {
        return self.renderToken(tokens, idx, options)
    }

    md.renderer.rules.link_open = (tokens, idx, options, env, self) => {
        // 添加 target="_blank" 属性
        tokens[idx].attrPush(['target', '_blank'])
        // 调用默认渲染器以实现默认行为
        return defaultRender(tokens, idx, options, env, self)
    }
}