import z from "zod";

export class ReviewsValidation {
    static readonly CREATE_SCHEMA = z.object({
        comment: z
            .string(),
        rating: z
            .coerce
            .number()
            .positive()
            .min(0, { message: "Minimum 0 star is allowed" })
            .max(5, { message: "Maximum 5 star is allowed" })
            
    })
    static readonly REPLY_SCHEMA = z.object({
        replyComment: z
            .string()
            .min(1, "Reply comment is required")
    })
    static readonly GET_LIST_SCHEMA = z.object({
        rating: z
            .coerce
            .number()
            .positive()
            .min(0, { message: "Minimum 0 star is allowed" })
            .max(5, { message: "Maximum 5 star is allowed" })
            .optional(),
        as: z
            .string()
            .toLowerCase()
            .refine((val) => {
                const validLevels = ["worker", "provider"]
                return validLevels.includes(val)
            }, {
                message: "As must be one of: Worker or Provider"
            })
            .optional(),
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
    static readonly UPDATE_SCHEMA = z.object({
        comment: z
            .string()
            .optional(),
        rating: z
            .coerce
            .number()
            .positive()
            .min(0, { message: "Minimum 0 star is allowed" })
            .max(5, { message: "Maximum 5 star is allowed" })
            .optional(),
    })
    static readonly UPDATE_REPLY_SCHEMA = z.object({
        replyComment: z
            .string()
    })
}

export type CreateReviewsRequest = z.infer<typeof ReviewsValidation.CREATE_SCHEMA>
export type ReplyReviewsRequest = z.infer<typeof ReviewsValidation.REPLY_SCHEMA>
export type GetListReviewsRequest = z.infer<typeof ReviewsValidation.GET_LIST_SCHEMA>
export type UpdateReviewsRequest = z.infer<typeof ReviewsValidation.UPDATE_SCHEMA>
export type UpdateReplyReviewsRequest = z.infer<typeof ReviewsValidation.UPDATE_REPLY_SCHEMA>