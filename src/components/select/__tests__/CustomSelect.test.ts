import {describe, it, expect, beforeEach, afterEach} from 'vitest';
import {mount, type VueWrapper} from '@vue/test-utils';
import {nextTick} from 'vue';
import CustomSelect from '@/components/select/CustomSelect.vue';
import {createOptions, type CustomSelectOption} from '@/components/select/createOptions.ts';

const stringOptions: CustomSelectOption<string>[] = [
    {id: 'a', label: 'Option A', value: 'a'},
    {id: 'b', label: 'Option B', value: 'b'},
    {id: 'c', label: 'Option C', value: 'c'},
];

const numberOptions: CustomSelectOption<number>[] = [
    {id: '1', label: 'One', value: 1},
    {id: '2', label: 'Two', value: 2},
    {id: '3', label: 'Three', value: 3},
];

interface TestObj {
    id: number;
    name: string;
}

const objOptions: CustomSelectOption<TestObj>[] = [
    {id: 'x', label: 'Obj X', value: {id: 1, name: 'x'}},
    {id: 'y', label: 'Obj Y', value: {id: 2, name: 'y'}},
];

const mountSelect = <T extends unknown = string>(
    props: Record<string, unknown> = {},
    options: CustomSelectOption<T>[] = stringOptions as unknown as CustomSelectOption<T>[],
): VueWrapper => {
    return mount(CustomSelect, {
        props: {
            options,
            ...props,
        },
    });
};

const getTrigger = (wrapper: VueWrapper) => wrapper.find('.custom-select-trigger');
const getDropdown = () => document.querySelector('.custom-select-dropdown') as HTMLElement | null;
const getDropdownOptions = () =>
    document.querySelectorAll('.custom-select-dropdown .custom-select-option:not(.select-all)');
const getSelectAllOption = () =>
    document.querySelector(
        '.custom-select-dropdown .custom-select-option.select-all',
    ) as HTMLElement | null;

const clickTrigger = async (wrapper: VueWrapper) => {
    await getTrigger(wrapper).trigger('click');
    await nextTick();
};

const clickOption = async (index: number) => {
    const options = getDropdownOptions();
    const option = options[index] as HTMLElement;
    if (option) {
        option.click();
        await nextTick();
    }
};

const clickSelectAll = async () => {
    const option = getSelectAllOption();
    if (option) {
        option.click();
        await nextTick();
    }
};

const pressEscape = async () => {
    document.dispatchEvent(new KeyboardEvent('keydown', {key: 'Escape', bubbles: true}));
    await nextTick();
};

const clickOutside = async () => {
    document.body.click();
    await nextTick();
};

describe('CustomSelect', () => {
    let wrapper: VueWrapper;

    afterEach(() => {
        wrapper?.unmount();
    });

    describe('createOptions', () => {
        it('创建字符串选项，label 等于 value', () => {
            const opts = createOptions(['a', 'b']);
            expect(opts).toEqual([
                {id: 'a', label: 'a', value: 'a'},
                {id: 'b', label: 'b', value: 'b'},
            ]);
        });

        it('创建数字选项，label 等于 value 的字符串形式', () => {
            const opts = createOptions([1, 2]);
            expect(opts).toEqual([
                {id: '1', label: '1', value: 1},
                {id: '2', label: '2', value: 2},
            ]);
        });

        it('通过 labelMap 映射展示文本', () => {
            const opts = createOptions(['png', 'svg'] as const, {
                png: 'PNG Image',
                svg: 'SVG Vector',
            });
            expect(opts).toEqual([
                {id: 'png', label: 'PNG Image', value: 'png'},
                {id: 'svg', label: 'SVG Vector', value: 'svg'},
            ]);
        });

        it('空数组返回空数组', () => {
            expect(createOptions([])).toEqual([]);
        });
    });

    describe('单选模式 — 渲染', () => {
        beforeEach(async () => {
            wrapper = mountSelect({modelValue: ''}, stringOptions);
            await nextTick();
        });

        it('默认显示 placeholder', () => {
            const label = getTrigger(wrapper).find('.trigger-label');
            expect(label.text()).toBe('');
        });

        it('提供 placeholder 时显示 placeholder', async () => {
            wrapper.unmount();
            wrapper = mountSelect({placeholder: '请选择'}, stringOptions);
            await nextTick();
            const label = getTrigger(wrapper).find('.trigger-label');
            expect(label.text()).toBe('请选择');
        });

        it('默认下拉面板不显示', () => {
            expect(getDropdown()).toBeNull();
        });

        it('点击触发器后显示下拉面板', async () => {
            await clickTrigger(wrapper);
            expect(getDropdown()).not.toBeNull();
        });

        it('下拉面板包含所有选项', async () => {
            await clickTrigger(wrapper);
            const optionEls = getDropdownOptions();
            expect(optionEls.length).toBe(3);
        });
    });

    describe('单选模式 — 交互', () => {
        beforeEach(async () => {
            wrapper = mountSelect({modelValue: '', placeholder: '请选择'}, stringOptions);
            await nextTick();
        });

        it('选择选项后更新 modelValue 并关闭面板', async () => {
            await clickTrigger(wrapper);
            await clickOption(0);

            expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['a']);
            expect(getDropdown()).toBeNull();
        });

        it('选择选项后显示选项的 label', async () => {
            await clickTrigger(wrapper);
            await clickOption(1);

            const label = getTrigger(wrapper).find('.trigger-label');
            expect(label.text()).toBe('Option B');
        });

        it('再次点击触发器关闭面板', async () => {
            await clickTrigger(wrapper);
            expect(getDropdown()).not.toBeNull();

            await clickTrigger(wrapper);
            expect(getDropdown()).toBeNull();
        });

        it('ESC 键关闭面板', async () => {
            await clickTrigger(wrapper);
            expect(getDropdown()).not.toBeNull();

            await pressEscape();
            expect(getDropdown()).toBeNull();
        });

        it('点击外部关闭面板', async () => {
            await clickTrigger(wrapper);
            expect(getDropdown()).not.toBeNull();

            await clickOutside();
            expect(getDropdown()).toBeNull();
        });
    });

    describe('单选 — 初始值', () => {
        it('有初始值时显示对应选项 label', async () => {
            wrapper = mountSelect({modelValue: 'b'}, stringOptions);
            await nextTick();
            const label = getTrigger(wrapper).find('.trigger-label');
            expect(label.text()).toBe('Option B');
        });

        it('初始值匹配不上任何选项时显示 placeholder', async () => {
            wrapper = mountSelect({modelValue: 'z', placeholder: '请选择'}, stringOptions);
            await nextTick();
            const label = getTrigger(wrapper).find('.trigger-label');
            expect(label.text()).toBe('请选择');
        });
    });

    describe('单选 — 禁用', () => {
        it('disabled 时点击触发器不打开面板', async () => {
            wrapper = mountSelect({modelValue: '', disabled: true}, stringOptions);
            await nextTick();

            await clickTrigger(wrapper);
            expect(getDropdown()).toBeNull();
        });

        it('disabled 选项不可点击选中', async () => {
            const opts: CustomSelectOption<string>[] = [
                {id: 'a', label: 'A', value: 'a'},
                {id: 'b', label: 'B', value: 'b', disabled: true},
            ];
            wrapper = mountSelect({modelValue: 'a'}, opts);
            await nextTick();

            await clickTrigger(wrapper);
            await clickOption(1);

            expect(wrapper.emitted('update:modelValue')).toBeUndefined();
            expect(getDropdown()).not.toBeNull();
        });
    });

    describe('单选 — 对象值', () => {
        it('使用相同引用的对象选项可正常选中', async () => {
            const val = objOptions[0]!.value;
            wrapper = mountSelect<TestObj>({modelValue: val}, objOptions);
            await nextTick();
            const label = getTrigger(wrapper).find('.trigger-label');
            expect(label.text()).toBe('Obj X');
        });

        it('选择对象选项后 emit 对象引用', async () => {
            wrapper = mountSelect<TestObj>(
                {modelValue: undefined as unknown as TestObj},
                objOptions,
            );
            await nextTick();

            await clickTrigger(wrapper);
            await clickOption(0);

            expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([objOptions[0]!.value]);
        });
    });

    describe('多选模式 — 渲染', () => {
        beforeEach(async () => {
            wrapper = mountSelect(
                {multiple: true, modelValue: [], placeholder: '选择'},
                stringOptions,
            );
            await nextTick();
        });

        it('显示 placeholder', () => {
            const label = getTrigger(wrapper).find('.trigger-label');
            expect(label.text()).toBe('选择');
        });

        it('无 selectAllLabel 时不显示全选选项', async () => {
            await clickTrigger(wrapper);
            expect(getSelectAllOption()).toBeNull();
        });

        it('有 selectAllLabel 时显示全选选项', async () => {
            wrapper.unmount();
            wrapper = mountSelect(
                {multiple: true, modelValue: [], selectAllLabel: '全选', placeholder: '选择'},
                stringOptions,
            );
            await nextTick();
            await clickTrigger(wrapper);
            expect(getSelectAllOption()).not.toBeNull();
        });

        it('选项前有 checkbox', async () => {
            await clickTrigger(wrapper);
            const optionEls = getDropdownOptions();
            const firstOption = optionEls[0];
            const checkbox = firstOption?.querySelector('input[type="checkbox"]');
            expect(checkbox).not.toBeNull();
        });
    });

    describe('多选模式 — 交互', () => {
        beforeEach(async () => {
            wrapper = mountSelect(
                {multiple: true, modelValue: [], selectAllLabel: '全选', placeholder: '选择'},
                stringOptions,
            );
            await nextTick();
        });

        it('选中选项后面板保持打开', async () => {
            await clickTrigger(wrapper);
            await clickOption(0);
            expect(getDropdown()).not.toBeNull();
        });

        it('选中选项后 modelValue 包含该值', async () => {
            await clickTrigger(wrapper);
            await clickOption(0);

            const emitted = wrapper.emitted('update:modelValue');
            expect(emitted?.[0]?.[0]).toEqual(['a']);
        });

        it('取消选中选项后从 modelValue 移除', async () => {
            await clickTrigger(wrapper);
            await clickOption(0);

            await clickOption(0);

            const emitted = wrapper.emitted('update:modelValue');
            expect(emitted?.[1]?.[0]).toEqual([]);
        });

        it('选中多个选项', async () => {
            await clickTrigger(wrapper);
            await clickOption(0);
            await clickOption(2);

            const emitted = wrapper.emitted('update:modelValue');
            expect(emitted?.[1]?.[0]).toEqual(['a', 'c']);
        });

        it('全选按钮选中所有选项', async () => {
            await clickTrigger(wrapper);
            await clickSelectAll();

            const emitted = wrapper.emitted('update:modelValue');
            expect(emitted?.[0]?.[0]).toEqual(['a', 'b', 'c']);
        });

        it('全选后再点全选取消所有', async () => {
            await clickTrigger(wrapper);
            await clickSelectAll();
            await clickSelectAll();

            const emitted = wrapper.emitted('update:modelValue');
            expect(emitted?.[1]?.[0]).toEqual([]);
        });

        it('手动选中所有选项后全选按钮自动勾选', async () => {
            await clickTrigger(wrapper);
            await clickOption(0);
            await clickOption(1);
            await clickOption(2);

            const selectAll = getSelectAllOption();
            const checkbox = selectAll?.querySelector('input[type="checkbox"]') as HTMLInputElement;
            expect(checkbox?.checked).toBe(true);
        });

        it('ESC 关闭面板', async () => {
            await clickTrigger(wrapper);
            expect(getDropdown()).not.toBeNull();

            await pressEscape();
            expect(getDropdown()).toBeNull();
        });
    });

    describe('多选 — 初始值', () => {
        it('有初始值时 trigger 显示个数', async () => {
            wrapper = mountSelect(
                {multiple: true, modelValue: ['a', 'c'], placeholder: '选择'},
                stringOptions,
            );
            await nextTick();
            const label = getTrigger(wrapper).find('.trigger-label');
            expect(label.text()).toBe('2');
        });

        it('初始值为空数组时显示 placeholder', async () => {
            wrapper = mountSelect(
                {multiple: true, modelValue: [], placeholder: '选择'},
                stringOptions,
            );
            await nextTick();
            const label = getTrigger(wrapper).find('.trigger-label');
            expect(label.text()).toBe('选择');
        });

        it('初始值为全部时显示 selectAllLabel', async () => {
            wrapper = mountSelect(
                {
                    multiple: true,
                    modelValue: ['a', 'b', 'c'],
                    selectAllLabel: '全选',
                    placeholder: '选择',
                },
                stringOptions,
            );
            await nextTick();
            const label = getTrigger(wrapper).find('.trigger-label');
            expect(label.text()).toBe('全选');
        });

        it('初始值匹配时下拉面板中对应选项已勾选', async () => {
            wrapper = mountSelect({multiple: true, modelValue: ['b']}, stringOptions);
            await nextTick();
            await clickTrigger(wrapper);

            const options = getDropdownOptions();
            const checkboxes = options[1]?.querySelector(
                'input[type="checkbox"]',
            ) as HTMLInputElement;
            expect(checkboxes?.checked).toBe(true);
        });
    });

    describe('多选 — 禁用选项', () => {
        it('disabled 选项在全选中被排除', async () => {
            const opts: CustomSelectOption<string>[] = [
                {id: 'a', label: 'A', value: 'a'},
                {id: 'b', label: 'B', value: 'b', disabled: true},
                {id: 'c', label: 'C', value: 'c'},
            ];
            wrapper = mountSelect({multiple: true, modelValue: [], selectAllLabel: '全选'}, opts);
            await nextTick();
            await clickTrigger(wrapper);
            await clickSelectAll();

            const emitted = wrapper.emitted('update:modelValue');
            expect(emitted?.[0]?.[0]).toEqual(['a', 'c']);
        });
    });

    describe('类型兼容性', () => {
        it('支持 number 类型的选项 — 单选', async () => {
            wrapper = mountSelect<number>({modelValue: 2 as number}, numberOptions);
            await nextTick();
            const label = getTrigger(wrapper).find('.trigger-label');
            expect(label.text()).toBe('Two');
        });
    });
});
