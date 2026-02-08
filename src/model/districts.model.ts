import { MasterDistrict } from "../generated/prisma/client"
import { parseJsonLocation } from "../utils/location.utils"

type locationJson = {
    id: string
    code: string
    name: string
}

export type getDistrictRequest = {
    districtId: string
}
export type districtResponse = {
    id: string
    code: string
    name: string
    province: {
        id: string
        code: string
        name: string
    }
    city: {
        id: string
        code: string
        name: string
    }
}
export function toDistrictResponse(district: MasterDistrict): districtResponse {
    const province = parseJsonLocation<locationJson>(district.province)
    const city = parseJsonLocation<locationJson>(district.city)

    return {
        id: district.id,
        code: district.code,
        name: district.name,
        province: province,
        city: city
    }
}

export type getDistrictByCityRequest = {
    cityId: string
}
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