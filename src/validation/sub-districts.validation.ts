import { z } from "zod";

export class SubDistrictsValidation {
    static readonly GET_SCHEMA = z.object({
        subDistrictId: z.string()
    })

    static readonly GET_SUBDISTRICT_BY_DISTRICTS_SCHEMA = z.object({
        districtId: z.string()
    })
}

export type GetSubDistrictRequest = z.infer<typeof SubDistrictsValidation.GET_SCHEMA>
export type GetSubDistrictByDistrictRequest = z.infer<typeof SubDistrictsValidation.GET_SUBDISTRICT_BY_DISTRICTS_SCHEMA>