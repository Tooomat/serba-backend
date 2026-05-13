import { Response, NextFunction } from "express";
import { AuthRequest } from "../web/middleware/auth.middleware";
import { GeocodingSearchRequest } from "../model/geocoding.model";
import { GeocodingService } from "../service/geocoding.service";
import { success_handler } from "../web/http/web-response.http";

export class GeocodingController {
    static async search(auth: AuthRequest, res: Response, next: NextFunction) {
        try {
            const request: GeocodingSearchRequest = {
                province: auth.query.province ? String(auth.query.province) : undefined,
                city: auth.query.city ? String(auth.query.city) : undefined,
                district: auth.query.district ? String(auth.query.district) : undefined,
                subDistrict: auth.query.subDistrict ? String(auth.query.subDistrict) : undefined,
                postalCode: auth.query.postalCode ? String(auth.query.postalCode) : undefined,
                street: auth.query.street ? String(auth.query.street) : undefined
            }
            const result = await GeocodingService.search(request)
            success_handler(res, "Search Geocoding successful", result, 200)
        } catch (e) {
            next(e)
        }
    }
}