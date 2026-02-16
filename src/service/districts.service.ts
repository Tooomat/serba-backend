import { prismaClient } from "../application/database";
import { ResponseError } from "../error/service-response.error";
import { 
    districtByCityResponse, 
    districtResponse,  
    toDistrictByCityResponse, 
    toDistrictResponse 
} from "../model/districts.model";

export class DistrictService {
    static async get(districtId: string): Promise<districtResponse> {

        const district = await prismaClient.masterDistrict.findUnique({
            where: {
                id: districtId
            }
        })

        if (!district) {
            throw new ResponseError(404, "District not found")
        }

        return toDistrictResponse(district)
    }

    static async getByCity(cityId: string): Promise<Array<districtByCityResponse>> {

        const districtsByCity = await prismaClient.masterDistrict.findMany({
            where:{
                cityId: cityId
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