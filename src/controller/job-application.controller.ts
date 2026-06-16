import { NextFunction, Response } from "express";
import { AuthRequest } from "../web/middleware/auth.middleware";
import { 
    createJobApplicationsRequest, 
    getListJobApplicationQuery, 
    updateJobApplicationRequest 
} from "../model/job-applications.model";
import { JobApplicationsService } from "../service/job-applications.service";
import { success_handler } from "../web/http/web-response.http";

export class JobApplicationController {
    static async create(auth: AuthRequest, res: Response, next: NextFunction) {
        try {
            const request: createJobApplicationsRequest = auth.body as createJobApplicationsRequest
            const jobId: string = String(auth.params.jobId)
            const { id: userId } = auth.user!

            const result = await JobApplicationsService.create(userId, jobId, request)
            success_handler(res, "Create job application successful", result, 201)
        } catch (e) {
            next(e)
        }
    }

    static async updateStatus(auth: AuthRequest, res: Response, next: NextFunction) {
        try {
            const request: updateJobApplicationRequest = auth.body as updateJobApplicationRequest
            const jobApplicationId: string = String(auth.params.jobApplicationId)
            const { id: userId } = auth.user!

            const result = await JobApplicationsService.updateStatus(userId, jobApplicationId, request)
            success_handler(res, "Mark job application success", result, 200)
        } catch (e) {
            next(e)
        }
    }

    static async getDetail(auth: AuthRequest, res: Response, next: NextFunction) {
        try {
            const jobApplicationId: string = String(auth.params.jobApplicationId)
            const { id: userId } = auth.user!

            const result = await JobApplicationsService.getDetail(userId, jobApplicationId)
            success_handler(res, "Get job application success", result, 200)
        } catch (e) {
            next(e)
        }
    }

    static async getListForJobProvider(auth: AuthRequest, res: Response, next: NextFunction) {
        try {
            const request: getListJobApplicationQuery = {
                status: auth.query.status ? String(auth.query.status) : undefined,
                name: auth.query.name ? String(auth.query.name) : undefined,
                page: auth.query.page ? Number(auth.query.page) : 1,
                size: auth.query.size ? Number(auth.query.size) : 10
            }
            const jobId: string = String(auth.params.jobId)

            const result = await JobApplicationsService.getListForJobProvider(jobId, request)
            success_handler(res, "Get list job applications success", result, 200)
        } catch (e) {
            next(e)
        }
    }

    static async getListForWorker(auth: AuthRequest, res: Response, next: NextFunction) {
        try {
            const request: getListJobApplicationQuery = {
                status: auth.query.status ? String(auth.query.status) : undefined,
                name: auth.query.name ? String(auth.query.name) : undefined,
                page: auth.query.page ? Number(auth.query.page) : 1,
                size: auth.query.size ? Number(auth.query.size) : 10
            }
            const { id: userId } = auth.user!

            const result = await JobApplicationsService.getListForWorker(userId, request)
            success_handler(res, "Get list job applications success", result, 200)
        } catch (e) {
            next(e)
        }
    }
}