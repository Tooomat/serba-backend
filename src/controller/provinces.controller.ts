import { NextFunction, Response } from "express";
import { AuthRequest } from "../web/middleware/auth.middleware";
import { getProvinceRequest } from "../model/provinces.model";
import { ProvincesService } from "../service/provinces.service";
import { success_handler } from "../web/http/web-response.http";

export class ProvincesController {
    static async get(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const request: getProvinceRequest = {
                provinceId: String(req.params.provinceId)
            }

            const result = await ProvincesService.get(request)
            success_handler(res, "get province successful", result, 200)
        } catch (e) {
            next(e)
        }
    }

    static async getAll(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const results = await ProvincesService.getAll()
            success_handler(res, "get provinces successful", results, 200)
        } catch (e) {
            next(e)
        }
    }
}