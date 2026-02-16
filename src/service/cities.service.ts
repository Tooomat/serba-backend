import { prismaClient } from "../application/database";
import { ResponseError } from "../error/service-response.error";
import { 
    cityByProvinceResponse, 
    cityResponse, 
    toCityByProvinceResponse, 
    toCityResponse 
} from "../model/cities.model";

export class CitiesService {
    static async get(cityId: string): Promise<cityResponse> {

        const city = await prismaClient.masterCity.findUnique({
            where: {
                id: cityId
            }
        })
        
        if(!city) {
            throw new ResponseError(404, "City not found")
        }

        return toCityResponse(city)
    }

    static async getByProvince(provinceId: string): Promise<Array<cityByProvinceResponse>> {

        const citiesByProvince = await prismaClient.masterCity.findMany({
            where: {
                provinceId: provinceId
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