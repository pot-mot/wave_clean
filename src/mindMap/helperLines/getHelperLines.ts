export type NodeBounds = {
    id: string;
    left: number;
    right: number;
    top: number;
    bottom: number;
    width: number;
    height: number;
};

type GetHelperLinesResult = {
    horizontal:
        | {
              value: number;
              target: NodeBounds;
          }
        | undefined;
    vertical:
        | {
              value: number;
              target: NodeBounds;
          }
        | undefined;
    snapPosition: {
        x: number | undefined;
        y: number | undefined;
    };
};

export const getHelperLines = (
    nodeA: NodeBounds,
    nodes: NodeBounds[],
    distance = 5,
): GetHelperLinesResult => {
    const result: GetHelperLinesResult = {
        horizontal: undefined,
        vertical: undefined,
        snapPosition: {x: undefined, y: undefined},
    };

    let horizontalDistance = distance;
    let verticalDistance = distance;

    for (const nodeB of nodes) {
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
            result.vertical = {target: nodeB, value: nodeB.left};
            verticalDistance = distanceLeftLeft;
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
            result.vertical = {target: nodeB, value: nodeB.right};
            verticalDistance = distanceRightRight;
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
            result.vertical = {target: nodeB, value: nodeB.right};
            verticalDistance = distanceLeftRight;
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
            result.vertical = {target: nodeB, value: nodeB.left};
            verticalDistance = distanceRightLeft;
        }

        //  |‾‾‾‾‾‾‾‾‾‾‾|‾‾‾‾‾|‾‾‾‾‾‾‾‾‾‾‾|
        //  |     A     |     |     B     |
        //  |___________|     |___________|
        const distanceTopTop = Math.abs(nodeA.top - nodeB.top);

        if (distanceTopTop < horizontalDistance) {
            result.snapPosition.y = nodeB.top;
            result.horizontal = {target: nodeB, value: nodeB.top};
            horizontalDistance = distanceTopTop;
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
            result.horizontal = {target: nodeB, value: nodeB.top};
            horizontalDistance = distanceBottomTop;
        }

        //  |‾‾‾‾‾‾‾‾‾‾‾|     |‾‾‾‾‾‾‾‾‾‾‾|
        //  |     A     |     |     B     |
        //  |___________|_____|___________|
        const distanceBottomBottom = Math.abs(nodeA.bottom - nodeB.bottom);

        if (distanceBottomBottom < horizontalDistance) {
            result.snapPosition.y = nodeB.bottom - nodeA.height;
            result.horizontal = {target: nodeB, value: nodeB.bottom};
            horizontalDistance = distanceBottomBottom;
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
            result.horizontal = {target: nodeB, value: nodeB.bottom};
            horizontalDistance = distanceTopBottom;
        }
    }

    return result;
};
