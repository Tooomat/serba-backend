import { ZodType, z } from "zod";

export class ExampleValidation {
    static readonly EXAMPLESCHEMA = z.object({
        username: z.string().min(1, 'Username must be at least 1 characters').max(100),
        password: z.string().min(8, 'Password must contain at least 8 characters').max(100),
        name: z.string().min(1, 'name must be at least 1 characters').max(100),
    })
}
// Export type dari schema
export type ExampleRequest = z.infer<typeof ExampleValidation.EXAMPLESCHEMA>;