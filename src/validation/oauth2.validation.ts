import z from "zod"

export class OAuth2Validation {
    static readonly GOOGLE_OAUTH2_SCHEMA = z.object({
        redirectPath: z
            .string()
            .min(1, "redirectPath is missing")
    })

    static readonly GOOGLE_OAUTH2_CALLBACK_SCHEMA = z.object({
        code: z
            .string()
            .optional(),
        state: z
            .string()
            .optional()
    })
}

export type GoogleOAuth2Request = z.infer<typeof OAuth2Validation.GOOGLE_OAUTH2_SCHEMA>
export type GoogleOAuth2CallbackRequest = z.infer<typeof OAuth2Validation.GOOGLE_OAUTH2_CALLBACK_SCHEMA>