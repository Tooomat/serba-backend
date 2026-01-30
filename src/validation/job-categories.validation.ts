import { z } from "zod";

export class JobCategoriesValidation {
    static readonly GETSCHEMA = z.object({
        id: z.string()
    })
}

export type GetJobCaregoryRequest = z.infer<typeof JobCategoriesValidation.GETSCHEMA>