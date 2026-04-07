import type {NodeBounds} from '@/mindMap/helperLines/type/NodeBounds.ts';

type HorizontalType = 'centerY' | 'top-top' | 'bottom-bottom' | 'top-bottom' | 'bottom-top';
type VerticalType = 'centerX' | 'left-left' | 'right-right' | 'left-right' | 'right-left';

type SnapLineResult = {
    horizontalMap: Map<
        HorizontalType,
        {
            value: number;
            targets: [NodeBounds, ...NodeBounds[]];
        }
    >;
    verticalMap: Map<
        VerticalType,
        {
            value: number;
            targets: [NodeBounds, ...NodeBounds[]];
        }
    >;
    snapPosition: {
        x: number | undefined;
        y: number | undefined;
    };
};

export const getSnapLines = (
    nodeA: NodeBounds,
    nodes: NodeBounds[],
    distance = 5,
): SnapLineResult => {
    const result: SnapLineResult = {
        horizontalMap: new Map(),
        verticalMap: new Map(),
        snapPosition: {x: undefined, y: undefined},
    };

    let horizontalDistance = distance;
    let verticalDistance = distance;

    const centerX_A = nodeA.left + nodeA.width / 2;
    const centerY_A = nodeA.top + nodeA.height / 2;

    for (const nodeB of nodes) {
        //    |‾‾‾‾‾‾‾‾‾‾‾|
        //    |     A     |
        //    |___________|
        //          |
        //          |
        //    |‾‾‾‾‾‾‾‾‾‾‾|
        //    |     B     |
        //    |___________|
        const centerX_B = nodeB.left + nodeB.width / 2;
        const distanceCenterX = Math.abs(centerX_A - centerX_B);

        if (distanceCenterX < verticalDistance) {
            result.snapPosition.x = nodeB.left + (nodeB.width - nodeA.width) / 2;
            result.verticalMap.set('centerX', {targets: [nodeB], value: centerX_B});
            verticalDistance = distanceCenterX;
        } else if (distanceCenterX === verticalDistance) {
            const vertical = result.verticalMap.get('centerX');
            if (!vertical) {
                result.verticalMap.set('centerX', {targets: [nodeB], value: centerX_B});
            } else {
                vertical.targets.push(nodeB);
            }
        }

        //  |‾‾‾‾‾‾‾‾‾‾‾|
        //  |     A     |
        //  |___________|
        //  |
        //  |
        //  |‾‾‾‾‾‾‾‾‾‾‾|
        //  |     B     |
        //  |___________|
        const distanceLeftLeft = Math.abs(nodeA.left - nodeB.left);

        if (distanceLeftLeft < verticalDistance) {
            result.snapPosition.x = nodeB.left;
            result.verticalMap.set('left-left', {targets: [nodeB], value: nodeB.left});
            verticalDistance = distanceLeftLeft;
        } else if (distanceLeftLeft === verticalDistance) {
            const vertical = result.verticalMap.get('left-left');
            if (!vertical) {
                result.verticalMap.set('left-left', {targets: [nodeB], value: nodeB.left});
            } else {
                vertical.targets.push(nodeB);
            }
        }

        //  |‾‾‾‾‾‾‾‾‾‾‾|
        //  |     A     |
        //  |___________|
        //              |
        //              |
        //  |‾‾‾‾‾‾‾‾‾‾‾|
        //  |     B     |
        //  |___________|
        const distanceRightRight = Math.abs(nodeA.right - nodeB.right);

        if (distanceRightRight < verticalDistance) {
            result.snapPosition.x = nodeB.right - nodeA.width;
            result.verticalMap.set('right-right', {targets: [nodeB], value: nodeB.right});
            verticalDistance = distanceRightRight;
        } else if (distanceRightRight === verticalDistance) {
            const vertical = result.verticalMap.get('right-right');
            if (!vertical) {
                result.verticalMap.set('right-right', {targets: [nodeB], value: nodeB.right});
            } else {
                vertical.targets.push(nodeB);
            }
        }

        //              |‾‾‾‾‾‾‾‾‾‾‾|
        //              |     A     |
        //              |___________|
        //              |
        //              |
        //  |‾‾‾‾‾‾‾‾‾‾‾|
        //  |     B     |
        //  |___________|
        const distanceLeftRight = Math.abs(nodeA.left - nodeB.right);

        if (distanceLeftRight < verticalDistance) {
            result.snapPosition.x = nodeB.right;
            result.verticalMap.set('left-right', {targets: [nodeB], value: nodeB.right});
            verticalDistance = distanceLeftRight;
        } else if (distanceLeftRight === verticalDistance) {
            const vertical = result.verticalMap.get('left-right');
            if (!vertical) {
                result.verticalMap.set('left-right', {targets: [nodeB], value: nodeB.right});
            } else {
                vertical.targets.push(nodeB);
            }
        }

        //  |‾‾‾‾‾‾‾‾‾‾‾|
        //  |     A     |
        //  |___________|
        //              |
        //              |
        //              |‾‾‾‾‾‾‾‾‾‾‾|
        //              |     B     |
        //              |___________|
        const distanceRightLeft = Math.abs(nodeA.right - nodeB.left);

        if (distanceRightLeft < verticalDistance) {
            result.snapPosition.x = nodeB.left - nodeA.width;
            result.verticalMap.set('right-left', {targets: [nodeB], value: nodeB.left});
            verticalDistance = distanceRightLeft;
        } else if (distanceRightLeft === verticalDistance) {
            const vertical = result.verticalMap.get('right-left');
            if (!vertical) {
                result.verticalMap.set('right-left', {targets: [nodeB], value: nodeB.left});
            } else {
                vertical.targets.push(nodeB);
            }
        }

        //  |‾‾‾‾‾‾‾‾‾‾‾|     |‾‾‾‾‾‾‾‾‾‾‾|
        //  |     A     |-----|     B     |
        //  |___________|     |___________|
        const centerY_B = nodeB.top + nodeB.height / 2;
        const distanceCenterY = Math.abs(centerY_A - centerY_B);

        if (distanceCenterY < horizontalDistance) {
            result.snapPosition.y = nodeB.top + (nodeB.height - nodeA.height) / 2;
            result.horizontalMap.set('centerY', {targets: [nodeB], value: centerY_B});
            horizontalDistance = distanceCenterY;
        } else if (distanceCenterY === horizontalDistance) {
            const horizontal = result.horizontalMap.get('centerY');
            if (!horizontal) {
                result.horizontalMap.set('centerY', {targets: [nodeB], value: centerY_B});
            } else {
                horizontal.targets.push(nodeB);
            }
        }

        //  |‾‾‾‾‾‾‾‾‾‾‾|‾‾‾‾‾|‾‾‾‾‾‾‾‾‾‾‾|
        //  |     A     |     |     B     |
        //  |___________|     |___________|
        const distanceTopTop = Math.abs(nodeA.top - nodeB.top);

        if (distanceTopTop < horizontalDistance) {
            result.snapPosition.y = nodeB.top;
            result.horizontalMap.set('top-top', {targets: [nodeB], value: nodeB.top});
            horizontalDistance = distanceTopTop;
        } else if (distanceTopTop === horizontalDistance) {
            const horizontal = result.horizontalMap.get('top-top');
            if (!horizontal) {
                result.horizontalMap.set('top-top', {targets: [nodeB], value: nodeB.top});
            } else {
                horizontal.targets.push(nodeB);
            }
        }

        //  |‾‾‾‾‾‾‾‾‾‾‾|
        //  |     A     |
        //  |___________|_________________
        //                    |           |
        //                    |     B     |
        //                    |___________|
        const distanceBottomTop = Math.abs(nodeA.bottom - nodeB.top);

        if (distanceBottomTop < horizontalDistance) {
            result.snapPosition.y = nodeB.top - nodeA.height;
            result.horizontalMap.set('bottom-top', {targets: [nodeB], value: nodeB.top});
            horizontalDistance = distanceBottomTop;
        } else if (distanceBottomTop === horizontalDistance) {
            const horizontal = result.horizontalMap.get('bottom-top');
            if (!horizontal) {
                result.horizontalMap.set('bottom-top', {targets: [nodeB], value: nodeB.top});
            } else {
                horizontal.targets.push(nodeB);
            }
        }

        //  |‾‾‾‾‾‾‾‾‾‾‾|     |‾‾‾‾‾‾‾‾‾‾‾|
        //  |     A     |     |     B     |
        //  |___________|_____|___________|
        const distanceBottomBottom = Math.abs(nodeA.bottom - nodeB.bottom);

        if (distanceBottomBottom < horizontalDistance) {
            result.snapPosition.y = nodeB.bottom - nodeA.height;
            result.horizontalMap.set('bottom-bottom', {targets: [nodeB], value: nodeB.bottom});
            horizontalDistance = distanceBottomBottom;
        } else if (distanceBottomBottom === horizontalDistance) {
            const horizontal = result.horizontalMap.get('bottom-bottom');
            if (!horizontal) {
                result.horizontalMap.set('bottom-bottom', {targets: [nodeB], value: nodeB.bottom});
            } else {
                horizontal.targets.push(nodeB);
            }
        }

        //                    |‾‾‾‾‾‾‾‾‾‾‾|
        //                    |     B     |
        //                    |           |
        //  |‾‾‾‾‾‾‾‾‾‾‾|‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾
        //  |     A     |
        //  |___________|
        const distanceTopBottom = Math.abs(nodeA.top - nodeB.bottom);

        if (distanceTopBottom < horizontalDistance) {
            result.snapPosition.y = nodeB.bottom;
            result.horizontalMap.set('top-bottom', {targets: [nodeB], value: nodeB.bottom});
            horizontalDistance = distanceTopBottom;
        } else if (distanceTopBottom === horizontalDistance) {
            const horizontal = result.horizontalMap.get('top-bottom');
            if (!horizontal) {
                result.horizontalMap.set('top-bottom', {targets: [nodeB], value: nodeB.bottom});
            } else {
                horizontal.targets.push(nodeB);
            }
        }
    }

    return result;
};
