import { config } from "../config/env";
import { ResponseError } from "../error/service-response.error";
import { GeocodingSearchRequest, GeocodingSearchResponse, toGeocodingResult } from "../model/geocoding.model";
import { GeocodingValidation } from "../validation/geocoding.validation";
import { Validation } from "../validation/validation";

export class GeocodingService {
    static async search(req: GeocodingSearchRequest): Promise<Array<GeocodingSearchResponse>> {
        const validate = Validation.validate(GeocodingValidation.SEARCH_SCHEMA, req)

        // Nominatim structured query
        const params: Record<string, string> = {
            format: "json",
            limit: "5",
            countrycodes: "id",
            addressdetails: "1"
        }

        if (validate.street)      params.street      = validate.street
        if (validate.postalCode)  params.postalcode  = validate.postalCode
        if (validate.subDistrict) params.suburb      = validate.subDistrict
        if (validate.district)    params.county      = validate.district
        if (validate.city)        params.city        = validate.city
        if (validate.province)    params.state       = validate.province

        const url = `https://nominatim.openstreetmap.org/search?${new URLSearchParams(params)}`

        const response = await fetch(url, {
            headers: {
                "User-Agent": `${config.APP_NAME}/${config.APP_V}`,
                "Accept-Language": "id"
            }
        })

        if (!response.ok) {
            throw new ResponseError(502, "Geocoding service unavailable")
        }

        const datas = await response.json()

        if (datas.length === 0) {
            throw new ResponseError(404, "Address not found")
        }

        return datas.map((data: any) => toGeocodingResult(data))
    }
}