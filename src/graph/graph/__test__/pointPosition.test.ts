// 测试用例示例（使用Jest框架）
import {localToPage, pageToLocal} from "@/graph/graph/pointPosition.ts";

describe('坐标系转换测试', () => {
    test('基础转换（无缩放/位移）', () => {
        const local = {scale: 1, translate: {x: 0, y: 0}};
        const localPoint = {x: 10, y: 20};

        expect(localToPage(localPoint, local)).toEqual({x: 10, y: 20});
        expect(pageToLocal({x: 10, y: 20}, local)).toEqual(localPoint);
    });

    test('纯缩放转换', () => {
        const local = {scale: 3, translate: {x: 0, y: 0}};
        const localPoint = {x: 5, y: 5};

        const page = localToPage(localPoint, local);
        expect(page).toEqual({x: 15, y: 15});

        const backToLocal = pageToLocal(page, local);
        expect(backToLocal).toEqual(localPoint);
    });

    test('纯位移转换', () => {
        const local = {scale: 1, translate: {x: 50, y: 100}};
        const localPoint = {x: 0, y: 0};

        expect(localToPage(localPoint, local)).toEqual({x: 50, y: 100});
        expect(pageToLocal({x: 50, y: 100}, local)).toEqual(localPoint);
    });

    test('缩放+位移组合转换', () => {
        const local = {scale: 2, translate: {x: 100, y: 200}};
        const localPoint = {x: 3, y: 4};

        const page = localToPage(localPoint, local);
        expect(page).toEqual({x: 3 * 2 + 100, y: 4 * 2 + 200}); // {x:106, y:208}

        const backToLocal = pageToLocal(page, local);
        expect(backToLocal).toEqual(localPoint);
    });

    test('逆向转换验证', () => {
        const local = {scale: 0.5, translate: {x: 50, y: 50}};
        const pagePoint = {x: 200, y: 300};

        const localPoint = pageToLocal(pagePoint, local);
        expect(localPoint).toEqual({x: (200 - 50) / 0.5, y: (300 - 50) / 0.5}); // {x:300, y:500}

        const backToPage = localToPage(localPoint, local);
        expect(backToPage).toEqual(pagePoint);
    });
});
