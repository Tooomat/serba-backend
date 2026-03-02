import { NextFunction, Response } from "express";
import { AuthRequest } from "../web/middleware/auth.middleware";
import { 
    createJobRequest, 
    queryListJob, 
    querySearchJob,
    updateJobRequest 
} from "../model/jobs.model";
import { JobsService } from "../service/jobs.service";
import { success_handler } from "../web/http/web-response.http";
import { LevelJob, StatusJob } from "../generated/prisma/enums";
import { toArray } from "../utils/formater.utils";

export class JobsController {
    static async create(auth: AuthRequest, res: Response, next: NextFunction) {
        try {
            const request: createJobRequest = auth.body as createJobRequest
            const { id: userId } = auth.user!

            const result = await JobsService.create(userId, request)
            success_handler(res, "Job created successfully", result, 201)
        } catch (e) {
            next(e)
        }
    } 

    static async listPublicJob(auth: AuthRequest, res: Response, next: NextFunction) {
        try {
            const request: queryListJob = {
                page: auth.query.page ? Number(auth.query.page) : 1,
                size: auth.query.size ? Number(auth.query.size) : 10
            }

            const results = await JobsService.listPublicJob(request)
            success_handler(res, "Get public jobs successfully", results, 200)
        } catch (e) {
            next(e)
        }
    } 

    static async get(auth: AuthRequest, res: Response, next: NextFunction) {
        try {
            const jobId: string = String(auth.params.jobId)
            const { id: userId } = auth.user!

            const results = await JobsService.get(userId, jobId)
            success_handler(res, "Get job successfully", results, 200)
        } catch (e) {
            next(e)
        }
    } 

    static async listMyCreatedJobs(auth: AuthRequest, res: Response, next: NextFunction) {
        try {
            const request: queryListJob = {
                page: auth.query.page ? Number(auth.query.page) : 1,
                size: auth.query.size ? Number(auth.query.size) : 10
            }
            const { id: userId } = auth.user!

            const results = await JobsService.listMyCreatedJobs(userId, request)
            success_handler(res, "Get jobs successfully", results, 200)
        } catch (e) {
            next(e)
        }
    } 

    static async searchJobs(auth: AuthRequest, res: Response, next: NextFunction) {
        try {
            
            // const request: querySearchJob = {
            //     jobCategoriesId: auth.query.jobCategoriesId as string[],
            //     title: auth.query.title as string,
            //     level: auth.query.level as string[],
            //     status: auth.query.status as string,
            //     provinceId: auth.query.provinceId as string,
            //     cityId: auth.query.cityId as string,
            //     districtId: auth.query.districtId as string,
            //     subdistrictId: auth.query.subdistrictId as string,
            //     page: auth.query.page ? Number(auth.query.page) : 1,
            //     size: auth.query.size ? Number(auth.query.size) : 10
            // }

            const request: querySearchJob = {
                page: auth.query.page ? Number(auth.query.page) : 1,
                size: auth.query.size ? Number(auth.query.size) : 10
            }

            if (auth.query.jobCategoriesId) {
                request.jobCategoriesId = toArray(auth.query.jobCategoriesId) as string[]
            }
            if (auth.query.title) {
                request.title = auth.query.title as string
            }
            if (auth.query.level) {
                request.level = toArray(auth.query.level) as string[]
            }
            if (auth.query.status) {
                request.status = auth.query.status as string
            }
            if (auth.query.provinceId) {
                request.provinceId = auth.query.provinceId as string
            }
            if (auth.query.cityId) {
                request.cityId = auth.query.cityId as string
            }
            if (auth.query.districtId) {
                request.districtId = auth.query.districtId as string
            }
            if (auth.query.subdistrictId) {
                request.subdistrictId = auth.query.subdistrictId as string
            }

            const { id: userId } = auth.user!

            const results = await JobsService.searchJobs(userId, request)
            success_handler(res, "Get jobs successfully", results, 200)
        } catch (e) {
            next(e)
        }
    } 

    static async update(auth: AuthRequest, res: Response, next: NextFunction) {
        try {
            const request: updateJobRequest = {
                addressId: auth.body.addressId ? auth.body.addressId as string : undefined,
                jobCategoriesId: auth.query.jobCategoriesId ? toArray(auth.query.jobCategoriesId) as string[] : undefined,
                title: auth.body.title ? auth.body.title as string : undefined,
                introduction: auth.body.introduction ? auth.body.introduction as string : undefined,
                description: auth.body.description ? auth.body.description as string : undefined,
                level: auth.body.level ? toArray(auth.body.level) as string[] : undefined,
                type: auth.body.type ? auth.body.type as string : undefined,
                required: auth.body.required ? auth.body.required as number : undefined,
                jobSite: auth.body.jobSite ? auth.body.jobSite as string : undefined,
                budgetMin: auth.body.budgetMin ? auth.body.budgetMin as number : undefined,
                budgetMax: auth.body.budgetMax ? auth.body.budgetMax as number : undefined, 
                budgetType: auth.body.budgetType ? auth.body.budgetType as string : undefined,
                status: auth.body.status ? auth.body.status as string : undefined,
                startTime: auth.body.startTime ? auth.body.startTime as string : undefined,
                endTime: auth.body.endTime ? auth.body.endTime as string : undefined,
                startDate: auth.body.startDate ? auth.body.startDate as string : undefined,
                endDate: auth.body.endDate ? auth.body.endDate as string : undefined
            }
            
            const jobId: string = String(auth.params.jobId)
            const { id: userId } = auth.user!

            const result = await JobsService.update(userId, jobId, request)
            success_handler(res, "Update job successfully", result, 200)
        } catch (e) {
            next(e)
        }
    } 

    static async delete(auth: AuthRequest, res: Response, next: NextFunction) {
        try {
            const jobId: string = String(auth.params.jobId)
            const { id: userId } = auth.user!

            const result = await JobsService.delete(userId, jobId)
            success_handler(res, "Delete job successfully", result, 200)
        } catch (e) {
            next(e)
        }
    } 
}