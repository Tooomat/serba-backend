import { getProvinceRequest, provinceResponse, toProvinceResponse } from "../model/provinces.model";
import { Validation } from "../validation/validation";
import { ProvincesValidation } from "../validation/provinces.validation";
import { prismaClient } from "../application/database";
import { ResponseError } from "../error/service-response.error";

export class ProvincesService {
    static async get(req: getProvinceRequest): Promise<provinceResponse> {
        const validation = Validation.validate(ProvincesValidation.GET_SCHEMA, req)

        const province = await prismaClient.masterProvince.findUnique({
            where: {
                id: validation.provinceId
            }
        })

        if (!province) {
            throw new ResponseError(404, "Province not found")
        }

        return toProvinceResponse(province)
    }

    static async getAll(): Promise<Array<provinceResponse>> {
        const provinces = await prismaClient.masterProvince.findMany()
        return provinces.map((province) => toProvinceResponse(province))
    }
}