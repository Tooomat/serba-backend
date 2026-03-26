import z from "zod"

export class BookmarksValidation { 
    static readonly LIST_SCHEMA = z.object({
        page: z
            .coerce
            .number()
            .min(1)
            .positive()
            .default(1),
        size: z
            .coerce
            .number()
            .min(1)
            .max(20)
            .positive()
            .default(10),
    })
}

export type ListBookmarksQuery = z.infer<typeof BookmarksValidation.LIST_SCHEMA>