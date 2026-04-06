import type {NodeBounds} from '@/mindMap/helperLines/type/NodeBounds.ts';

type HorizontalType = 'centerY' | 'top-top' | 'bottom-bottom' | 'top-bottom' | 'bottom-top';
type VerticalType = 'centerX' | 'left-left' | 'right-right' | 'left-right' | 'right-left';

type SnapLineResult = {
    horizontal:
        | {
              type: HorizontalType;
              value: number;
              targets: [NodeBounds, ...NodeBounds[]];
          }
        | undefined;
    vertical:
        | {
              type: VerticalType;
              value: number;
              targets: [NodeBounds, ...NodeBounds[]];
          }
        | undefined;
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
        horizontal: undefined,
        vertical: undefined,
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
            result.vertical = {type: 'centerX', targets: [nodeB], value: centerX_B};
            verticalDistance = distanceCenterX;
        } else if (
            distanceCenterX === verticalDistance &&
            result.vertical &&
            result.vertical.type === 'centerX'
        ) {
            result.vertical.targets.push(nodeB);
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
            result.vertical = {type: 'left-left', targets: [nodeB], value: nodeB.left};
            verticalDistance = distanceLeftLeft;
        } else if (
            distanceLeftLeft === verticalDistance &&
            result.vertical &&
            result.vertical.type === 'left-left'
        ) {
            result.vertical.targets.push(nodeB);
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
            result.vertical = {type: 'right-right', targets: [nodeB], value: nodeB.right};
            verticalDistance = distanceRightRight;
        } else if (
            distanceRightRight === verticalDistance &&
            result.vertical &&
            result.vertical.type === 'right-right'
        ) {
            result.vertical.targets.push(nodeB);
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
            result.vertical = {type: 'left-right', targets: [nodeB], value: nodeB.right};
            verticalDistance = distanceLeftRight;
        } else if (
            distanceLeftRight === verticalDistance &&
            result.vertical &&
            result.vertical.type === 'left-right'
        ) {
            result.vertical.targets.push(nodeB);
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
            result.vertical = {type: 'right-left', targets: [nodeB], value: nodeB.left};
            verticalDistance = distanceRightLeft;
        } else if (
            distanceRightLeft === verticalDistance &&
            result.vertical &&
            result.vertical.type === 'right-left'
        ) {
            result.vertical.targets.push(nodeB);
        }

        //  |‾‾‾‾‾‾‾‾‾‾‾|     |‾‾‾‾‾‾‾‾‾‾‾|
        //  |     A     |-----|     B     |
        //  |___________|     |___________|
        const centerY_B = nodeB.top + nodeB.height / 2;
        const distanceCenterY = Math.abs(centerY_A - centerY_B);

        if (distanceCenterY < horizontalDistance) {
            result.snapPosition.y = nodeB.top + (nodeB.height - nodeA.height) / 2;
            result.horizontal = {type: 'centerY', targets: [nodeB], value: centerY_B};
            horizontalDistance = distanceCenterY;
        } else if (
            distanceCenterY === horizontalDistance &&
            result.horizontal &&
            result.horizontal.type === 'centerY'
        ) {
            result.horizontal.targets.push(nodeB);
        }

        //  |‾‾‾‾‾‾‾‾‾‾‾|‾‾‾‾‾|‾‾‾‾‾‾‾‾‾‾‾|
        //  |     A     |     |     B     |
        //  |___________|     |___________|
        const distanceTopTop = Math.abs(nodeA.top - nodeB.top);

        if (distanceTopTop < horizontalDistance) {
            result.snapPosition.y = nodeB.top;
            result.horizontal = {type: 'top-top', targets: [nodeB], value: nodeB.top};
            horizontalDistance = distanceTopTop;
        } else if (
            distanceTopTop === horizontalDistance &&
            result.horizontal &&
            result.horizontal.type === 'top-top'
        ) {
            result.horizontal.targets.push(nodeB);
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
            result.horizontal = {type: 'bottom-top', targets: [nodeB], value: nodeB.top};
            horizontalDistance = distanceBottomTop;
        } else if (
            distanceBottomTop === horizontalDistance &&
            result.horizontal &&
            result.horizontal.type === 'bottom-top'
        ) {
            result.horizontal.targets.push(nodeB);
        }

        //  |‾‾‾‾‾‾‾‾‾‾‾|     |‾‾‾‾‾‾‾‾‾‾‾|
        //  |     A     |     |     B     |
        //  |___________|_____|___________|
        const distanceBottomBottom = Math.abs(nodeA.bottom - nodeB.bottom);

        if (distanceBottomBottom < horizontalDistance) {
            result.snapPosition.y = nodeB.bottom - nodeA.height;
            result.horizontal = {type: 'bottom-bottom', targets: [nodeB], value: nodeB.bottom};
            horizontalDistance = distanceBottomBottom;
        } else if (
            distanceBottomBottom === horizontalDistance &&
            result.horizontal &&
            result.horizontal.type === 'bottom-bottom'
        ) {
            result.horizontal.targets.push(nodeB);
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
            result.horizontal = {type: 'top-bottom', targets: [nodeB], value: nodeB.bottom};
            horizontalDistance = distanceTopBottom;
        } else if (
            distanceTopBottom === horizontalDistance &&
            result.horizontal &&
            result.horizontal.type === 'top-bottom'
        ) {
            result.horizontal.targets.push(nodeB);
        }
    }

    return result;
};
