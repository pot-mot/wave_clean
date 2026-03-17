import {describe, it, expect, vi, beforeEach, afterEach} from 'vitest';
import {mount} from '@vue/test-utils';
import ResizeWrapper from '../ResizeWrapper.vue';
import {resizeBorderKeys, resizeHandleKeys, type ResizeWrapperProps} from '../ResizeWrapperType';

describe('ResizeWrapper', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    const createWrapper = (
        props: Partial<ResizeWrapperProps> = {},
        size = {width: 100, height: 100},
    ) => {
        return mount(ResizeWrapper, {
            props: {
                modelValue: size,
                ...props,
            },
            slots: {
                default: '<div>Content</div>',
            },
            attachTo: document.body,
        });
    };

    describe('基本渲染', () => {
        it('应该正确渲染组件', () => {
            const wrapper = createWrapper();
            expect(wrapper.find('.resize-wrapper').exists()).toBe(true);
        });

        it('应该应用初始尺寸', () => {
            const size = {width: 200, height: 150};
            const wrapper = createWrapper({}, size);
            const resizeWrapper = wrapper.find('.resize-wrapper');
            const style = resizeWrapper.attributes('style');
            expect(style).toContain('width: 200px');
            expect(style).toContain('height: 150px');
        });

        it('应该渲染内容插槽', () => {
            const wrapper = createWrapper();
            expect(wrapper.text()).toContain('Content');
        });
    });

    describe('调整手柄', () => {
        it('默认应该显示所有调整手柄', () => {
            const wrapper = createWrapper();

            resizeBorderKeys.forEach((key) => {
                expect(wrapper.find(`.resize-border.${key}`).exists()).toBe(true);
            });

            resizeHandleKeys.forEach((key) => {
                expect(wrapper.find(`.resize-handle.${key}`).exists()).toBe(true);
            });
        });

        it('当 disabled 为 true 时不应该显示调整手柄', () => {
            const wrapper = createWrapper({disabled: true});

            resizeBorderKeys.forEach((key) => {
                expect(wrapper.find(`.resize-border.${key}`).exists()).toBe(false);
            });

            resizeHandleKeys.forEach((key) => {
                expect(wrapper.find(`.resize-handle.${key}`).exists()).toBe(false);
            });
        });
    });

    describe('尺寸限制', () => {
        it('应该遵守 minWidth 限制', async () => {
            const size = {width: 100, height: 100};
            const wrapper = createWrapper({minWidth: 150}, size);

            await wrapper.vm.$nextTick();
            expect(size.width).toBe(150);
        });

        it('应该遵守 maxWidth 限制', async () => {
            const size = {width: 200, height: 100};
            const wrapper = createWrapper({maxWidth: 150}, size);

            await wrapper.vm.$nextTick();
            expect(size.width).toBe(150);
        });

        it('应该遵守 minHeight 限制', async () => {
            const size = {width: 100, height: 100};
            const wrapper = createWrapper({minHeight: 150}, size);

            await wrapper.vm.$nextTick();
            expect(size.height).toBe(150);
        });

        it('应该遵守 maxHeight 限制', async () => {
            const size = {width: 100, height: 200};
            const wrapper = createWrapper({maxHeight: 150}, size);

            await wrapper.vm.$nextTick();
            expect(size.height).toBe(150);
        });

        it('初始尺寸受最小限制', async () => {
            const size = {width: 100, height: 100};
            const wrapper = createWrapper(
                {
                    minWidth: 120,
                    maxWidth: 180,
                    minHeight: 120,
                    maxHeight: 180,
                },
                size,
            );

            await wrapper.vm.$nextTick();
            expect(size.width).toBe(120);
            expect(size.height).toBe(120);
        });

        it('初始尺寸受最大限制', async () => {
            const size = {width: 300, height: 300};
            const wrapper = createWrapper(
                {
                    minWidth: 120,
                    maxWidth: 180,
                    minHeight: 120,
                    maxHeight: 180,
                },
                size,
            );

            await wrapper.vm.$nextTick();
            expect(size.width).toBe(180);
            expect(size.height).toBe(180);
        });
    });

    describe('鼠标拖拽调整大小', () => {
        it('应该触发 resize-start 事件', async () => {
            const wrapper = createWrapper();

            const handle = wrapper.find('.resize-handle.bottom-right');
            await handle.trigger('mousedown', {clientX: 100, clientY: 100});

            expect(wrapper.emitted('resize-start')).toHaveLength(1);
            expect(wrapper.emitted('resize-start')?.[0]?.[0]).toStrictEqual({
                origin: {
                    clientX: 100,
                    clientY: 100,
                    width: 100,
                    height: 100,
                },
                direction: 'bottom-right',
            });
        });

        it('拖动右下角应该增加宽度和高度', async () => {
            vi.useFakeTimers();

            const size = {width: 100, height: 100};
            const wrapper = createWrapper({}, size);

            const handle = wrapper.find('.resize-handle.bottom-right');
            await handle.trigger('mousedown', {clientX: 100, clientY: 100});
            await handle.trigger('mousemove', {clientX: 150, clientY: 150});

            await vi.runAllTimersAsync();
            await wrapper.vm.$nextTick();

            expect(size.width).toBe(150);
            expect(size.height).toBe(150);
        });

        it('拖动左上角应该减少宽度和高度', async () => {
            vi.useFakeTimers();

            const size = {width: 100, height: 100};
            const wrapper = createWrapper({}, size);

            const handle = wrapper.find('.resize-handle.top-left');
            await handle.trigger('mousedown', {clientX: 100, clientY: 100});
            await handle.trigger('mousemove', {clientX: 150, clientY: 150});

            await vi.runAllTimersAsync();
            await wrapper.vm.$nextTick();

            expect(size.width).toBe(50);
            expect(size.height).toBe(50);
        });

        it('拖动右边应该只增加宽度', async () => {
            vi.useFakeTimers();

            const size = {width: 100, height: 100};
            const wrapper = createWrapper({}, size);

            const border = wrapper.find('.resize-border.right');
            await border.trigger('mousedown', {clientX: 100, clientY: 100});
            await border.trigger('mousemove', {clientX: 150, clientY: 100});

            await vi.runAllTimersAsync();
            await wrapper.vm.$nextTick();

            expect(size.width).toBe(150);
            expect(size.height).toBe(100);
        });

        it('拖动底部应该只增加高度', async () => {
            vi.useFakeTimers();

            const size = {width: 100, height: 100};
            const wrapper = createWrapper({}, size);

            const border = wrapper.find('.resize-border.bottom');
            await border.trigger('mousedown', {clientX: 100, clientY: 100});
            await border.trigger('mousemove', {clientX: 100, clientY: 150});

            await vi.runAllTimersAsync();
            await wrapper.vm.$nextTick();

            expect(size.width).toBe(100);
            expect(size.height).toBe(150);
        });

        it('应该触发 resize 事件', async () => {
            vi.useFakeTimers();

            const size = {width: 100, height: 100};
            const wrapper = createWrapper({}, size);

            const handle = wrapper.find('.resize-handle.bottom-right');
            await handle.trigger('mousedown', {clientX: 100, clientY: 100});
            await handle.trigger('mousemove', {clientX: 150, clientY: 150});

            await vi.runAllTimersAsync();
            await wrapper.vm.$nextTick();

            expect(wrapper.emitted('resize')).toHaveLength(1);
            const resizeEvent: any = wrapper.emitted('resize')?.[0]?.[0];
            expect(resizeEvent.direction).toBe('bottom-right');
            expect(resizeEvent.currentSize.width).toBe(150);
            expect(resizeEvent.currentSize.height).toBe(150);
        });

        it('应该触发 resize-stop 事件', async () => {
            const size = {width: 100, height: 100};
            const wrapper = createWrapper({}, size);

            const handle = wrapper.find('.resize-handle.bottom-right');
            await handle.trigger('mousedown', {clientX: 100, clientY: 100});
            await handle.trigger('mousemove', {clientX: 150, clientY: 150});
            await handle.trigger('mouseup', {clientX: 150, clientY: 150});

            expect(wrapper.emitted('resize-stop')).toHaveLength(1);
            const stopEvent: any = wrapper.emitted('resize-stop')?.[0]?.[0];
            expect(stopEvent.direction).toBe('bottom-right');
            expect(stopEvent.totalSizeDiff.x).toBe(50);
            expect(stopEvent.totalSizeDiff.y).toBe(50);
        });

        it('应该清理鼠标事件监听器', async () => {
            const addEventListenerSpy = vi.spyOn(document, 'addEventListener');
            const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');

            const size = {width: 100, height: 100};
            const wrapper = createWrapper({}, size);

            const handle = wrapper.find('.resize-handle.bottom-right');
            await handle.trigger('mousedown', {clientX: 100, clientY: 100});
            await handle.trigger('mousemove', {clientX: 150, clientY: 150});
            await handle.trigger('mouseup', {clientX: 150, clientY: 150});

            expect(addEventListenerSpy).toHaveBeenCalledWith('mousemove', expect.any(Function));
            expect(removeEventListenerSpy).toHaveBeenCalledWith('mousemove', expect.any(Function));

            addEventListenerSpy.mockRestore();
            removeEventListenerSpy.mockRestore();
        });
    });

    describe('触摸事件', () => {
        it('应该支持触摸开始调整', async () => {
            const wrapper = createWrapper();

            const handle = wrapper.find('.resize-handle.bottom-right');
            const touchEvent = {
                touches: [{clientX: 100, clientY: 100}],
                changedTouches: [{clientX: 100, clientY: 100}],
            };

            await handle.trigger('touchstart', touchEvent);

            expect(wrapper.emitted('resize-start')).toHaveLength(1);
        });

        it('应该支持触摸移动调整', async () => {
            vi.useFakeTimers();

            const size = {width: 100, height: 100};
            const wrapper = createWrapper({}, size);

            const handle = wrapper.find('.resize-handle.bottom-right');

            const startTouch = {
                touches: [{clientX: 100, clientY: 100}],
                changedTouches: [{clientX: 100, clientY: 100}],
            };
            await handle.trigger('touchstart', startTouch);

            const moveTouch = {
                touches: [{clientX: 150, clientY: 150}],
                changedTouches: [{clientX: 150, clientY: 150}],
            };
            await handle.trigger('touchmove', moveTouch);

            await vi.runAllTimersAsync();
            await wrapper.vm.$nextTick();

            expect(size.width).toBe(150);
            expect(size.height).toBe(150);
        });
    });

    describe('暴露的属性', () => {
        it('应该暴露 isResizing 属性', async () => {
            const wrapper = createWrapper();

            expect(wrapper.vm.isResizing).toBe(false);

            const handle = wrapper.find('.resize-handle.bottom-right');
            await handle.trigger('mousedown', {clientX: 100, clientY: 100});

            expect(wrapper.vm.isResizing).toBe(true);

            await handle.trigger('mouseup', {clientX: 100, clientY: 100});

            expect(wrapper.vm.isResizing).toBe(false);
        });
    });

    describe('边界情况', () => {
        it('如果在非调整状态下触发 mousemove 应该清理事件', async () => {
            const wrapper = createWrapper();

            document.dispatchEvent(
                new MouseEvent('mousemove', {
                    clientX: 150,
                    clientY: 150,
                }),
            );

            expect(wrapper.emitted('resize')).toBeUndefined();
        });
    });
});
