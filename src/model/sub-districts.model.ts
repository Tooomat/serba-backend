import { MasterSubdistrict } from "../generated/prisma/client"
import { parseJsonLocation } from "../utils/location.utils"

type locationJson = {
    id: string
    code: string
    name: string
}

export type getSubDistrictRequest = {
    subDistrictId: string
}
export type subDistrictResponse = {
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
    district: {
        id: string
        code: string
        name: string
    }
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

export type getSubDistrictByDistricRequest = {
    districtId: string
}
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