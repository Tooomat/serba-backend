import { prismaClient } from "../application/database";
import { ResponseError } from "../error/service-response.error";
import { 
    districtByCityResponse, 
    districtResponse, 
    getDistrictByCityRequest, 
    getDistrictRequest, 
    toDistrictByCityResponse, 
    toDistrictResponse 
} from "../model/districts.model";
import { DistrictsValidation } from "../validation/districts.validation";
import { Validation } from "../validation/validation";

export class DistrictService {
    static async get(req: getDistrictRequest): Promise<districtResponse> {
        const validation = Validation.validate(DistrictsValidation.GET_SCHEMA, req)

        const district = await prismaClient.masterDistrict.findUnique({
            where: {
                id: validation.districtId
            }
        })

        if (!district) {
            throw new ResponseError(404, "District not found")
        }

        return toDistrictResponse(district)
    }

    static async getByCity(req: getDistrictByCityRequest): Promise<Array<districtByCityResponse>> {
        const validation = Validation.validate(DistrictsValidation.GET_DISTRICT_BY_CITY_SCHEMA, req)

        const districtsByCity = await prismaClient.masterDistrict.findMany({
            where:{
                cityId: validation.cityId
            },
            orderBy: {
                name: "asc" 
            }
        })

        return districtsByCity.map((districtByCity) => toDistrictByCityResponse(districtByCity))
    }


    static async getAll(): Promise<Array<districtResponse>> {
        const districts = await prismaClient.masterDistrict.findMany()
        return districts.map((district) => toDistrictResponse(district))
    }
}