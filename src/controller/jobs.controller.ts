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
import { formater } from "../utils/formater.utils";

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
                request.jobCategoriesId = formater.toArray(auth.query.jobCategoriesId) as string[]
            }
            if (auth.query.title) {
                request.title = String(auth.query.title)
            }
            if (auth.query.level) {
                request.level = formater.toArray(auth.query.level) as string[]
            }
            if (auth.query.status) {
                request.status = String(auth.query.status)
            }
            if (auth.query.provinceId) {
                request.provinceId = String(auth.query.provinceId)
            }
            if (auth.query.cityId) {
                request.cityId = String(auth.query.cityId)
            }
            if (auth.query.districtId) {
                request.districtId = String(auth.query.districtId)
            }
            if (auth.query.subdistrictId) {
                request.subdistrictId = String(auth.query.subdistrictId)
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
                addressId: auth.body.addressId ? String(auth.body.addressId) : undefined,
                jobCategoriesId: auth.query.jobCategoriesId ? formater.toArray(auth.query.jobCategoriesId) as string[] : undefined,
                title: auth.body.title ? String(auth.body.title) : undefined,
                introduction: auth.body.introduction ? String(auth.body.introduction) : undefined,
                description: auth.body.description ? String(auth.body.description) : undefined,
                level: auth.body.level ? formater.toArray(auth.body.level) as string[] : undefined,
                type: auth.body.type ? String(auth.body.type) : undefined,
                required: auth.body.required ? Number(auth.body.required) : undefined,  
                jobSite: auth.body.jobSite ? String(auth.body.jobSite) : undefined,
                budgetMin: auth.body.budgetMin ? Number(auth.body.budgetMin) : undefined,  
                budgetMax: auth.body.budgetMax ? Number(auth.body.budgetMax) : undefined,  
                budgetType: auth.body.budgetType ? String(auth.body.budgetType) : undefined,
                status: auth.body.status ? String(auth.body.status) : undefined,
                startTime: auth.body.startTime ? String(auth.body.startTime) : undefined,
                endTime: auth.body.endTime ? String(auth.body.endTime) : undefined,
                startDate: auth.body.startDate ? String(auth.body.startDate) : undefined,
                endDate: auth.body.endDate ? String(auth.body.endDate) : undefined,
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