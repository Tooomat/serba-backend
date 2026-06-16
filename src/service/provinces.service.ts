import { provinceResponse, toProvinceResponse } from "../model/provinces.model";
import { prismaClient } from "../application/database";
import { ResponseError } from "../error/service-response.error";

export class ProvincesService {
    static async get(provinceId: string): Promise<provinceResponse> {

        const province = await prismaClient.masterProvince.findUnique({
            where: {
                id: provinceId
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