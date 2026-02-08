import { z } from "zod";

export class DistrictsValidation {
    static readonly GET_SCHEMA = z.object({
        districtId: z.string()
    })

    static readonly GET_DISTRICT_BY_CITY_SCHEMA = z.object({
        cityId: z.string()
    })
}

export type GetDistrictRequest = z.infer<typeof DistrictsValidation.GET_SCHEMA>
export type GetDistrictByCityRequest = z.infer<typeof DistrictsValidation.GET_DISTRICT_BY_CITY_SCHEMA>