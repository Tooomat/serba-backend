import { z } from "zod";

export class CitiesValidation {
    static readonly GET_SCHEMA = z.object({
        cityId: z.string()
    })

    static readonly GET_CITY_BY_PROVINCE_SCHEMA = z.object({
        provinceId: z.string()
    })
}

export type GetCitesRequest = z.infer<typeof CitiesValidation.GET_SCHEMA>
export type GetCitiesByProvinceRequest = z.infer<typeof CitiesValidation.GET_CITY_BY_PROVINCE_SCHEMA>