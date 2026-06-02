<script setup lang="ts">
import {ref, useTemplateRef} from 'vue';
import {type ContentNode, validateContentNode} from '@/mindMap/node/ContentNode.ts';
import {type ContentEdge, validateContentEdge} from '@/mindMap/edge/ContentEdge.ts';
import {useMindMap} from '@/mindMap/useMindMap.ts';
import {sendMessage} from '@/components/message/messageApi.ts';
import type {MatchedEdgeInfo, MatchedNodeInfo} from '@/mindMap/searcher/MatchedInfo.ts';
import ResultContent from '@/mindMap/searcher/HighlightContent.vue';
import IconSearch from '@/components/icons/IconSearch.vue';
import {translate} from '@/store/i18nStore.ts';

const {layers, fitRect, currentLayer, toggleLayer, selectNode, selectEdge, graphSelection} =
    useMindMap();

const searchKeywords = ref('');

type SearchType = 'whole' | 'splitByBlank' | 'regex';
const searchType = ref<SearchType>('whole');

const caseSensitive = ref(false);

const searchInputRef = useTemplateRef<HTMLInputElement>('searchInputRef');

const searchResult = ref<{
    nodes: MatchedNodeInfo[];
    edges: MatchedEdgeInfo[];
}>({
    nodes: [],
    edges: [],
});

const handleSearch = () => {
    searchResult.value.nodes = [];
    searchResult.value.edges = [];

    const keywords = getKeywords();
    if (keywords.length === 0) return;

    for (const layer of layers) {
        const nodes = layer.vueFlow.getNodes.value;
        const edges = layer.vueFlow.getEdges.value;

        for (const node of nodes) {
            if (!validateContentNode(node)) continue;
            let matchedItem: MatchedNodeInfo | undefined;
            for (const keyword of keywords) {
                const matches = findMatches((node as ContentNode).data.content, keyword);
                if (matches.length > 0) {
                    if (matchedItem === undefined) {
                        matchedItem = {
                            node,
                            layerId: layer.id,
                            viewRanges: matches,
                        };
                        searchResult.value.nodes.push(matchedItem);
                    } else {
                        matchedItem.viewRanges.push(...matches);
                    }
                }
            }
        }
        for (const edge of edges) {
            if (!validateContentEdge(edge)) continue;
            let matchedItem: MatchedEdgeInfo | undefined;
            for (const keyword of keywords) {
                const matches = findMatches((edge as ContentEdge).data.content, keyword);
                if (matches.length > 0) {
                    if (matchedItem === undefined) {
                        matchedItem = {
                            edge,
                            layerId: layer.id,
                            viewRanges: matches,
                        };
                        searchResult.value.edges.push(matchedItem);
                    } else {
                        matchedItem.viewRanges.push(...matches);
                    }
                }
            }
        }
    }
};

const getKeywords = (): string[] => {
    const input = searchKeywords.value.trim();
    if (!input) return [];

    switch (searchType.value) {
        case 'splitByBlank':
            return input.split(/\s+/).filter((it) => it.length > 0);
        case 'regex':
            // 正则模式下，整个输入作为一个正则表达式
            return [input];
        case 'whole':
        default:
            return [input];
    }
};

const findMatches = (content: string, keyword: string): [number, number][] => {
    const matches: [number, number][] = [];

    switch (searchType.value) {
        case 'regex': {
            try {
                const flags = caseSensitive.value ? 'g' : 'gi';
                const regex = new RegExp(keyword, flags);
                let match;
                while ((match = regex.exec(content)) !== null) {
                    matches.push([match.index, match.index + match[0].length]);
                }
            } catch (e) {
                // 正则表达式无效时返回空数组
                console.warn('Invalid regex:', e);
            }
            break;
        }
        case 'whole':
        case 'splitByBlank':
        default: {
            if (caseSensitive.value) {
                // 区分大小写的普通搜索
                let startIndex = 0;
                while (true) {
                    const index = content.indexOf(keyword, startIndex);
                    if (index === -1) break;
                    matches.push([index, index + keyword.length]);
                    startIndex = index + keyword.length;
                }
            } else {
                // 不区分大小写的普通搜索
                const lowerContent = content.toLowerCase();
                const lowerKeyword = keyword.toLowerCase();
                let startIndex = 0;
                while (true) {
                    const index = lowerContent.indexOf(lowerKeyword, startIndex);
                    if (index === -1) break;
                    matches.push([index, index + keyword.length]);
                    startIndex = index + keyword.length;
                }
            }
            break;
        }
    }

    return matches;
};

const focusNode = (item: MatchedNodeInfo) => {
    const layer = layers.find((it) => it.id === item.layerId);
    if (!layer || !layer.vueFlow.findNode(item.node.id)) {
        sendMessage('node not exists now', {
            type: 'warning',
        });
        return;
    }
    const node = item.node;
    if (!node.dimensions) {
        sendMessage('node no dimensions', {
            type: 'warning',
        });
        return;
    }
    if (item.layerId !== currentLayer.value.id) {
        toggleLayer(item.layerId);
    }
    fitRect({
        x: node.position.x,
        y: node.position.y,
        width: node.dimensions.width,
        height: node.dimensions.height,
    });
    graphSelection.unselectAll();
    selectNode(node.id);
};

const focusEdge = (item: MatchedEdgeInfo) => {
    const layer = layers.find((it) => it.id === item.layerId);
    if (!layer || !layer.vueFlow.findEdge(item.edge.id)) {
        sendMessage('edge not exists now', {
            type: 'warning',
        });
        return;
    }
    const edge = item.edge;
    if (!edge.data.size || !edge.data.position) {
        sendMessage('edge no size or position', {
            type: 'warning',
        });
        return;
    }
    if (item.layerId !== currentLayer.value.id) {
        toggleLayer(item.layerId);
    }
    fitRect({
        x: edge.data.position.left,
        y: edge.data.position.top,
        width: edge.data.size.width,
        height: edge.data.size.height,
    });
    graphSelection.unselectAll();
    selectEdge(edge.id);
};

defineExpose({
    focusInput: () => {
        searchInputRef.value?.focus();
    },
});
</script>

<template>
    <teleport to="body">
        <div class="mind-map-searcher">
            <div>
                <input
                    ref="searchInputRef"
                    class="search-input"
                    v-model="searchKeywords"
                    @keydown.enter="handleSearch()"
                />
                <select
                    v-model="searchType"
                    class="search-type-select"
                >
                    <option value="whole">{{ translate('searchType_whole') }}</option>
                    <option value="splitByBlank">{{ translate('searchType_splitByBlank') }}</option>
                    <option value="regex">{{ translate('searchType_regex') }}</option>
                </select>
                <label class="case-sensitive-label">
                    <input
                        type="checkbox"
                        v-model="caseSensitive"
                    />
                    <span>{{ translate('searchConfig_caseSensitive') }}</span>
                </label>
                <button @click="handleSearch()">
                    <icon-search />
                </button>
                <slot />
            </div>
            <div class="search-result">
                <div
                    v-for="node in searchResult.nodes"
                    :key="node.node.id + node.layerId"
                    class="search-result-item"
                    @click="focusNode(node)"
                >
                    <span>
                        {{ layers.find((it) => it.id === node.layerId)?.name }}
                    </span>
                    <span> Node </span>
                    <ResultContent
                        :content="node.node.data.content"
                        :view-ranges="node.viewRanges"
                    />
                </div>
                <div
                    v-for="edge in searchResult.edges"
                    :key="edge.edge.id + edge.layerId"
                    class="search-result-item"
                    @click="focusEdge(edge)"
                >
                    <span>
                        {{ layers.find((it) => it.id === edge.layerId)?.name }}
                    </span>
                    <span> Edge </span>
                    <ResultContent
                        :content="edge.edge.data.content"
                        :view-ranges="edge.viewRanges"
                    />
                </div>
            </div>
        </div>
    </teleport>
</template>

<style scoped>
.mind-map-searcher {
    position: absolute;
    top: 20%;
    left: 50%;
    transform: translateX(-50%);
    width: 60vw;
    z-index: var(--toolbar-z-index);
    padding: 1rem 0.5rem;
    font-size: 1rem;
    border: var(--border);
    border-radius: var(--border-radius);
    background-color: var(--background-color);
}

.search-input {
    width: 100%;
}

.search-type-select {
    margin-top: 0.5rem;
    padding: 0.25rem 0.5rem;
    border: var(--border);
    border-radius: var(--border-radius);
    background-color: var(--background-color);
    cursor: pointer;
}

.case-sensitive-label {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    margin-top: 0.5rem;
    margin-left: 0.5rem;
    cursor: pointer;
    user-select: none;
}

.search-result {
    max-height: calc(60 * var(--vh));
    overflow-y: auto;
}

.search-result-item {
    overflow: hidden;
    display: grid;
    grid-template-columns: 1fr auto;
    padding: 0.5rem;
    cursor: pointer;
}
</style>
