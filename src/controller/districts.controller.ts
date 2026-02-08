import { NextFunction, Response } from "express";
import { AuthRequest } from "../web/middleware/auth.middleware";
import { getDistrictByCityRequest, getDistrictRequest } from "../model/districts.model";
import { DistrictService } from "../service/districts.service";
import { success_handler } from "../web/http/web-response.http";

 
export class DistrictsController {
    static async get(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const request: getDistrictRequest = {
                districtId: String(req.params.districtId)
            }

            const result = await DistrictService.get(request)
            success_handler(res, "get districts successful", result, 200)
        } catch (e) {
            next(e)
        }
    }
    static async getByCity(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const request: getDistrictByCityRequest = {
                cityId: String(req.params.cityId)
            }
            
            const results = await DistrictService.getByCity(request)
            success_handler(res, "get districts by city and province successful", results, 200)
        } catch (e) {
            next(e)
        }
    }
    static async getAll(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const results = await DistrictService.getAll()
            success_handler(res, "get districts successful", results, 200)
        } catch (e) {
            next(e)
        }
    }
 }