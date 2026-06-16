import { MasterProvince } from "../generated/prisma/client"

export type provinceResponse = {
    id: string
    code: string
    name: string
}

export function toProvinceResponse(province: MasterProvince): provinceResponse {
    return {
        id: province.id,
        code: province.code,
        name: province.name
    }
}