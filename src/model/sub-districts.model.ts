import { MasterSubdistrict } from "../generated/prisma/client"
import { parseJsonLocation } from "../utils/location.utils"

type locationJson = {
    id: string
    code: string
    name: string
}

// ================================== GET ==================================
export type subDistrictResponse = {
    id: string
    code: string
    name: string
    province: locationJson
    city: locationJson
    district: locationJson
}
export function toSubDistrictResponse(subDistricts: MasterSubdistrict): subDistrictResponse {
    const province = parseJsonLocation<locationJson>(subDistricts.province)
    const city = parseJsonLocation<locationJson>(subDistricts.city)
    const district = parseJsonLocation<locationJson>(subDistricts.district)
    
    return {
        id: subDistricts.id, 
        code: subDistricts.code,
        name: subDistricts.name,
        province: province,
        city: city,
        district: district
    }
}

// ================================== GET BY DISTRICT ==================================
export type subDistrictByDistrictResponse = {
    id: string
    name: string
    code: string
}
export function toSubDistrictByDistrictResponse(subDistricts: MasterSubdistrict): subDistrictByDistrictResponse {
    return {
        id: subDistricts.id,
        name: subDistricts.name,
        code: subDistricts.code
    }
}