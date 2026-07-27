export interface CustomSelectOption<T = unknown> {
    id: string;
    label: string;
    value: T;
    disabled?: boolean;
}

export const createOptions = <T extends string | number>(
    values: readonly T[],
    labelMap?: Record<T, string>,
): CustomSelectOption<T>[] => {
    return values.map((v) => ({
        id: String(v),
        label: labelMap?.[v] ?? String(v),
        value: v,
    }));
};
