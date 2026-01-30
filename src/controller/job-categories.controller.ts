import { NextFunction, Response } from "express";
import { AuthRequest } from "../web/middleware/auth.middleware";
import { JobCategoriesService } from "../service/job-categories.service";
import { success_handler } from "../web/http/web-response.http";
import { getJobCaregoryRequest } from "../model/job-categories.model";

export class JobCategoriesController {
    static async getAll(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const results = await JobCategoriesService.getAll(req)
            success_handler(res, "get job categories successful", results, 200)
        } catch (e) {
            next(e)
        }
    }

    static async get(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const request: getJobCaregoryRequest = {
                id: String(req.params.jobCategoryId)
            }

            const result = await JobCategoriesService.get(req, request)
            success_handler(res, "get job category successful", result, 200)
        } catch (e) {
            next(e)
        }
    }   
}