export type MarkWritable<T, K extends keyof T> = {
    -readonly [P in K]: T[P];
} & Omit<T, K>;
