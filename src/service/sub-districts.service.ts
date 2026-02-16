import { prismaClient } from "../application/database";
import { ResponseError } from "../error/service-response.error";
import { 
    subDistrictByDistrictResponse,
    subDistrictResponse, 
    toSubDistrictByDistrictResponse, 
    toSubDistrictResponse
} from "../model/sub-districts.model";

export class SubDistrictsService {
    static async get(subDistrictId: string): Promise<subDistrictResponse> {
        const subDistrict = await prismaClient.masterSubdistrict.findUnique({
            where: {
                id: subDistrictId
            }
        })

        if (!subDistrict) {
            throw new ResponseError(404, "Sub District not found")
        }

        return toSubDistrictResponse(subDistrict)
    }

    static async getByDistrict(districtId: string): Promise<Array<subDistrictByDistrictResponse>> {
        const subDistricts = await prismaClient.masterSubdistrict.findMany({
            where: {
                districtId: districtId
            },
            orderBy: {
                name: "asc"
            }
        })

        return subDistricts.map((subDistrict) => toSubDistrictByDistrictResponse(subDistrict))
    }
    static async getAll(): Promise<Array<subDistrictResponse>> {
        const subDistricts = await prismaClient.masterSubdistrict.findMany()
        return subDistricts.map((subDistrict) => toSubDistrictResponse(subDistrict))
    }
}