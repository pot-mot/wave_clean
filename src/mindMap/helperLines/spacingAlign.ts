import type {NodeBounds} from '@/mindMap/helperLines/type/NodeBounds.ts';
import type {
    HorizontalHelperLine,
    VerticalHelperLine,
} from '@/mindMap/helperLines/type/HelpLine.ts';

interface SpacingMatch {
    gap: number;
    node1: NodeBounds;
    node2: NodeBounds;
}

const getVerticalIntersectNodes = (nodeA: NodeBounds, nodes: NodeBounds[]): NodeBounds[] =>
    nodes.filter((nodeB) => nodeA.left <= nodeB.right && nodeA.right >= nodeB.left);

const getHorizontalIntersectNodes = (nodeA: NodeBounds, nodes: NodeBounds[]): NodeBounds[] =>
    nodes.filter((nodeB) => nodeA.top <= nodeB.bottom && nodeA.bottom >= nodeB.top);

// 节点水平间距对齐
export const getHorizontalSpacingAlign = (
    nodeA: NodeBounds,
    _nodes: NodeBounds[],
    distance = 5,
):
    | {
          lines: HorizontalHelperLine[];
          snapX: number | undefined;
      }
    | undefined => {
    const nodes = getHorizontalIntersectNodes(nodeA, _nodes);
    if (nodes.length < 2) return undefined;

    // 按左边界排序
    const sortedNodes = [nodeA, ...nodes].sort((a, b) => a.left - b.left);
    const nodeAIndex = sortedNodes.findIndex((node) => node.id === nodeA.id);
    if (nodeAIndex === -1) return undefined;

    // 依次获取节点间距，并记录各个节点间的差值
    const gapPairs: {index: number; node1: NodeBounds; node2: NodeBounds; gap: number}[] = [];
    let currentPrevGap: number | undefined;
    let currentNextGap: number | undefined;

    for (let i = 0; i < sortedNodes.length - 1; i++) {
        const node1 = sortedNodes[i];
        if (node1 === undefined) continue;
        const node2 = sortedNodes[i + 1];
        if (node2 === undefined) continue;

        const gap = node2.left - node1.right;
        if (gap > 0) {
            gapPairs.push({index: i, node1, node2, gap});
            if (i === nodeAIndex - 1) currentPrevGap = gap;
            if (i === nodeAIndex) currentNextGap = gap;
        }
    }

    if (currentPrevGap === undefined && currentNextGap === undefined) {
        return undefined;
    }

    // 寻找匹配
    let matches: SpacingMatch[] = [];
    let minDiff = distance;

    if (currentPrevGap !== undefined) {
        for (const pair of gapPairs) {
            if (pair.index === nodeAIndex - 1) continue;
            const diff = Math.abs(pair.gap - currentPrevGap);
            if (diff < minDiff) {
                minDiff = diff;
                matches = [
                    {
                        gap: pair.gap,
                        node1: pair.node1,
                        node2: pair.node2,
                    },
                ];
            } else if (diff === minDiff) {
                matches.push({
                    gap: pair.gap,
                    node1: pair.node1,
                    node2: pair.node2,
                });
            }
        }
    }

    if (currentNextGap !== undefined) {
        for (const pair of gapPairs) {
            if (pair.index === nodeAIndex) continue;
            const diff = Math.abs(pair.gap - currentNextGap);
            if (diff < minDiff) {
                minDiff = diff;
                matches.length = 0;
                matches = [
                    {
                        gap: pair.gap,
                        node1: pair.node1,
                        node2: pair.node2,
                    },
                ];
            } else if (diff === minDiff) {
                matches.push({
                    gap: pair.gap,
                    node1: pair.node1,
                    node2: pair.node2,
                });
            }
        }
    }

    if (matches[0] === undefined) return undefined;
    const match = matches[0];

    // 生成辅助线
    const lines: HorizontalHelperLine[] = [];
    for (const match of matches) {
        lines.push({
            startX: match.node1.right,
            endX: match.node2.left,
            y: (match.node1.top + match.node1.bottom + match.node2.top + match.node2.bottom) / 4,
        });
    }

    // 计算吸附位置
    let snapX: number | undefined;
    if (currentPrevGap !== undefined) {
        const prevNode = sortedNodes[nodeAIndex - 1];
        if (prevNode) {
            const newLeft = prevNode.right + match.gap;
            if (
                snapX === undefined ||
                Math.abs(nodeA.left - newLeft) < Math.abs(nodeA.left - snapX)
            ) {
                snapX = newLeft;
            }

            lines.push({
                startX: prevNode.right,
                endX: newLeft,
                y: (prevNode.top + prevNode.bottom + nodeA.top + nodeA.bottom) / 4,
            });
        }
    }

    if (currentNextGap !== undefined) {
        const nextNode = sortedNodes[nodeAIndex + 1];
        if (nextNode) {
            const newRight = nextNode.left - match.gap;
            const newLeft = newRight - nodeA.width;
            if (
                snapX === undefined ||
                Math.abs(nodeA.left - newLeft) < Math.abs(nodeA.left - snapX)
            ) {
                snapX = newLeft;
            }

            lines.push({
                startX: newRight,
                endX: nextNode.left,
                y: (nodeA.top + nodeA.bottom + nextNode.top + nextNode.bottom) / 4,
            });
        }
    }

    return {lines, snapX};
};

// 节点垂直间距对齐
export const getVerticalSpacingAlign = (
    nodeA: NodeBounds,
    _nodes: NodeBounds[],
    distance = 5,
):
    | {
          lines: VerticalHelperLine[];
          snapY: number | undefined;
      }
    | undefined => {
    const nodes = getVerticalIntersectNodes(nodeA, _nodes);
    if (nodes.length < 2) return undefined;

    // 按上边界排序
    const sortedNodes = [nodeA, ...nodes].sort((a, b) => a.top - b.top);
    const nodeAIndex = sortedNodes.findIndex((node) => node.id === nodeA.id);
    if (nodeAIndex === -1) return undefined;

    // 依次获取节点间距，并记录各个节点间的差值
    const gapPairs: {index: number; node1: NodeBounds; node2: NodeBounds; gap: number}[] = [];
    let currentPrevGap: number | undefined;
    let currentNextGap: number | undefined;

    for (let i = 0; i < sortedNodes.length - 1; i++) {
        const node1 = sortedNodes[i];
        if (node1 === undefined) continue;
        const node2 = sortedNodes[i + 1];
        if (node2 === undefined) continue;

        const gap = node2.top - node1.bottom;
        if (gap > 0) {
            gapPairs.push({index: i, node1, node2, gap});
            if (i === nodeAIndex - 1) currentPrevGap = gap;
            if (i === nodeAIndex) currentNextGap = gap;
        }
    }

    if (currentPrevGap === undefined && currentNextGap === undefined) {
        return undefined;
    }

    // 寻找匹配
    let matches: SpacingMatch[] = [];
    let minDiff = distance;

    if (currentPrevGap !== undefined) {
        for (const pair of gapPairs) {
            if (pair.index === nodeAIndex - 1) continue;
            const diff = Math.abs(pair.gap - currentPrevGap);
            if (diff < minDiff) {
                minDiff = diff;
                matches = [
                    {
                        gap: pair.gap,
                        node1: pair.node1,
                        node2: pair.node2,
                    },
                ];
            } else if (diff === minDiff) {
                matches.push({
                    gap: pair.gap,
                    node1: pair.node1,
                    node2: pair.node2,
                });
            }
        }
    }

    if (currentNextGap !== undefined) {
        for (const pair of gapPairs) {
            if (pair.index === nodeAIndex) continue;
            const diff = Math.abs(pair.gap - currentNextGap);
            if (diff < minDiff) {
                minDiff = diff;
                matches.length = 0;
                matches = [
                    {
                        gap: pair.gap,
                        node1: pair.node1,
                        node2: pair.node2,
                    },
                ];
            } else if (diff === minDiff) {
                matches.push({
                    gap: pair.gap,
                    node1: pair.node1,
                    node2: pair.node2,
                });
            }
        }
    }

    if (matches[0] === undefined) return undefined;
    const match = matches[0];

    // 生成辅助线
    const lines: VerticalHelperLine[] = [];
    for (const match of matches) {
        lines.push({
            startY: match.node1.bottom,
            endY: match.node2.top,
            x: (match.node1.left + match.node1.right + match.node2.left + match.node2.right) / 4,
        });
    }

    // 计算吸附位置
    let snapY: number | undefined;
    if (currentPrevGap !== undefined) {
        const prevNode = sortedNodes[nodeAIndex - 1];
        if (prevNode) {
            const newTop = prevNode.bottom + match.gap;
            if (snapY === undefined || Math.abs(nodeA.top - newTop) < Math.abs(nodeA.top - snapY)) {
                snapY = newTop;
            }

            lines.push({
                startY: prevNode.bottom,
                endY: newTop,
                x: (prevNode.left + prevNode.right + nodeA.left + nodeA.right) / 4,
            });
        }
    }

    if (currentNextGap !== undefined) {
        const nextNode = sortedNodes[nodeAIndex + 1];
        if (nextNode) {
            const newBottom = nextNode.top - match.gap;
            const newTop = newBottom - nodeA.height;
            if (snapY === undefined || Math.abs(nodeA.top - newTop) < Math.abs(nodeA.top - snapY)) {
                snapY = newTop;
            }

            lines.push({
                startY: newBottom,
                endY: nextNode.top,
                x: (nodeA.left + nodeA.right + nextNode.left + nextNode.right) / 4,
            });
        }
    }

    return {lines, snapY};
};
