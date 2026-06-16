import { MasterDistrict } from "../generated/prisma/client"
import { locationUtils } from "../utils/location.utils"

type locationJson = {
    id: string
    code: string
    name: string
}

// ================================== GET ==================================
export type districtResponse = {
    id: string
    code: string
    name: string
    province: locationJson
    city: locationJson
}
export function toDistrictResponse(district: MasterDistrict): districtResponse {
    const province = locationUtils.parseJsonLocation<locationJson>(district.province)
    const city = locationUtils.parseJsonLocation<locationJson>(district.city)

    return {
        id: district.id,
        code: district.code,
        name: district.name,
        province: province,
        city: city
    }
}

// ================================== GET BY CITY ==================================
export type districtByCityResponse = {
    id: string
    name: string
    code: string
}
export function toDistrictByCityResponse(district: MasterDistrict): districtByCityResponse {
    return {
        id: district.id,
        name: district.name,
        code: district.code
    }
}