import { JsonValue } from "@prisma/client/runtime/client"

export function parseJsonLocation<T>(value: JsonValue): T {
    return value as T
}