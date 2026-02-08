import { z } from "zod";

export class ProvincesValidation {
    static readonly GET_SCHEMA = z.object({
        provinceId: z.string()
    })
}

export type GetProvincesRequest = z.infer<typeof ProvincesValidation.GET_SCHEMA>