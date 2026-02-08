import { NextFunction, Response } from "express";
import { AuthRequest } from "../web/middleware/auth.middleware";
import { getCitiesByProvinceRequest, getCityRequest } from "../model/cities.model";
import { CitiesService } from "../service/cities.service";
import { success_handler } from "../web/http/web-response.http";

export class CitiesController {
    static async get(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const request: getCityRequest = {
                cityId: String(req.params.cityId)
            }        

            const result = await CitiesService.get(request)
            success_handler(res, "get city successful", result, 200)
        } catch (e) {
            next(e)
        }
    }

    static async getByProvince(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const request: getCitiesByProvinceRequest = {
                provinceId: String(req.params.provinceId)
            }

            const results = await CitiesService.getByProvince(request)
            success_handler(res, "get city by province successful", results, 200)
        } catch (e) {
            next(e)
        }
    }
    
    static async getAll(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const results = await CitiesService.getAll()
            success_handler(res, "get cities successful", results, 200)
        } catch (e) {
            next(e)
        }
    }
}