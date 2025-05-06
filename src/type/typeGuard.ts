import type {JSONSchemaType} from "ajv/lib/types/json-schema.ts";

export const isSymbol = (arg: any): arg is symbol => {
    return typeof arg === 'symbol';
}

export const isString = (arg: any): arg is string => {
    return typeof arg === 'string';
}

import Ajv, {ErrorObject} from "ajv";
const ajv = new Ajv({ allErrors: true }); // 启用所有错误信息

export const createSchemaValidator = <T>(schema: JSONSchemaType<T>, errorHandler?: (errors: ErrorObject[] | null | undefined) => void) => {
    const validate = ajv.compile(schema)

    return (data: unknown): data is T => {
        const valid = validate(data)

        if (!valid) {
            errorHandler?.(validate.errors)
            return false
        }

        return true
    }
}

export type SchemaValidator<T> = ReturnType<typeof createSchemaValidator<T>>
