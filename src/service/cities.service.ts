import { prismaClient } from "../application/database";
import { ResponseError } from "../error/service-response.error";
import { 
    cityByProvinceResponse, 
    cityResponse, 
    getCitiesByProvinceRequest, 
    getCityRequest, 
    toCityByProvinceResponse, 
    toCityResponse 
} from "../model/cities.model";
import { CitiesValidation } from "../validation/cities.validation";
import { Validation } from "../validation/validation";

export class CitiesService {
    static async get(req: getCityRequest): Promise<cityResponse> {
        const validation = Validation.validate(CitiesValidation.GET_SCHEMA, req)
        
        const city = await prismaClient.masterCity.findUnique({
            where: {
                id: validation.cityId
            }
        })
        
        if(!city) {
            throw new ResponseError(404, "City not found")
        }

        return toCityResponse(city)
    }

    static async getByProvince(req: getCitiesByProvinceRequest): Promise<Array<cityByProvinceResponse>> {
        const validation = Validation.validate(CitiesValidation.GET_CITY_BY_PROVINCE_SCHEMA, req)

        const citiesByProvince = await prismaClient.masterCity.findMany({
            where: {
                provinceId: validation.provinceId
            },
            orderBy: {
                name: "asc" 
            }
        })

        return citiesByProvince.map((cityByProvince) => toCityByProvinceResponse(cityByProvince))
    }

    static async getAll(): Promise<Array<cityResponse>> {
        const cities = await prismaClient.masterCity.findMany()
        return cities.map((city) => toCityResponse(city))
    }
}