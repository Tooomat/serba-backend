import { MasterCity } from "../generated/prisma/client"
import { parseJsonLocation } from "../utils/location.utils"

type locationJson = {
  id: string
  code: string
  name: string
}

// ================================== GET ==================================
export type cityResponse = {
    id: string
    code: string
    name: string
    province: locationJson
}
export function toCityResponse(city: MasterCity): cityResponse {
    const province = parseJsonLocation<locationJson>(city.province)
    return {
        id: city.id,
        code: city.code,
        name: city.name,
        province: province
    }
}

// ================================== GET BY PROVINCE ==================================
export type cityByProvinceResponse = {
    id: string
    name: string
    code: string
}
export function toCityByProvinceResponse(city: MasterCity): cityByProvinceResponse {
    return {
        id: city.id,
        name: city.name,
        code: city.code
    }
}