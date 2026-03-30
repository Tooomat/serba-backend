import { ZodTypeAny , z } from "zod";

// OWASP A03 - Injection = Zod validation di setiap request — validasi input
export class Validation {
    static validate<T extends ZodTypeAny>(
        schema: T,
        data: unknown
    ): z.infer<T> {
        return schema.parse(data)
    }
}