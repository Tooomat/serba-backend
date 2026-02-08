import { NextFunction, Response } from "express";
import { AuthRequest } from "../web/middleware/auth.middleware";
import { getSubDistrictByDistricRequest, getSubDistrictRequest } from "../model/sub-districts.model";
import { SubDistrictsService } from "../service/sub-districts.service";
import { success_handler } from "../web/http/web-response.http";

export class SubDistrictsController {
    static async get(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const request: getSubDistrictRequest = {
                subDistrictId: String(req.params.subDistrictId)
            }

            const result = await SubDistrictsService.get(request)
            success_handler(res, "get district successful", result, 200)
        } catch (e) {
            next(e)
        }
    }
    static async getByDistrict(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const request: getSubDistrictByDistricRequest = {
                districtId: String(req.params.districtId)
            }

            const results = await SubDistrictsService.getByDistrict(request)
            success_handler(res, "get subdistrict by district successful", results, 200)
        } catch (e) {
            next(e)
        }
    }
    static async getAll(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const results = await SubDistrictsService.getAll()
            success_handler(res, "get districts successful", results, 200)
        } catch (e) {
            next(e)
        }
    }
}