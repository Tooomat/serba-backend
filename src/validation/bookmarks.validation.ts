import z from "zod"

export class BookmarksValidation { 
    static readonly LIST_SCHEMA = z.object({
        page: z
            .coerce
            .number("Page must be a number" )
            .min(1, "Page must be at least 1")
            .positive("Page must be a positive number")
            .default(1),
        size: z
            .coerce
            .number("Size must be a number" )
            .min(1, "Size must be at least 1")
            .max(20, "Size must be at most 20")
            .positive("Size must be a positive number")
            .default(10),
    })
}

export type ListBookmarksQuery = z.infer<typeof BookmarksValidation.LIST_SCHEMA>