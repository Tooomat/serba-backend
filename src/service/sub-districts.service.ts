import { prismaClient } from "../application/database";
import { ResponseError } from "../error/service-response.error";
import { 
    getSubDistrictByDistricRequest,
    getSubDistrictRequest,
    subDistrictByDistrictResponse,
    subDistrictResponse, 
    toSubDistrictByDistrictResponse, 
    toSubDistrictResponse
} from "../model/sub-districts.model";
import { SubDistrictsValidation } from "../validation/sub-districts.validation";
import { Validation } from "../validation/validation";

export class SubDistrictsService {
    static async get(req: getSubDistrictRequest): Promise<subDistrictResponse> {
        const validate = Validation.validate(SubDistrictsValidation.GET_SCHEMA, req)
        const subDistrict = await prismaClient.masterSubdistrict.findUnique({
            where: {
                id: validate.subDistrictId
            }
        })

        if (!subDistrict) {
            throw new ResponseError(404, "Sub District not found")
        }

        return toSubDistrictResponse(subDistrict)
    }
    static async getByDistrict(req: getSubDistrictByDistricRequest): Promise<Array<subDistrictByDistrictResponse>> {
        const subDistricts = await prismaClient.masterSubdistrict.findMany({
            where: {
                districtId: req.districtId
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