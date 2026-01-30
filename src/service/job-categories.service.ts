import { prismaClient } from "../application/database";
import { ResponseError } from "../error/service-response.error";
import * as model from "../model/job-categories.model";
import { JobCategoriesValidation } from "../validation/job-categories.validation";
import { Validation } from "../validation/validation";
import { AuthRequest } from "../web/middleware/auth.middleware";

export class JobCategoriesService {
    static async getAll(auth: AuthRequest): Promise<Array<model.jobCategoriesResponse>>{
        const jobCategories = await prismaClient.jobCategories.findMany({
            where: {
                isActive: true
            }
        })

        return jobCategories.map((jobCategory) => model.toJobCategoriesResponse(jobCategory))
    }

    static async get(auth: AuthRequest, req: model.getJobCaregoryRequest): Promise<model.jobCategoriesResponse> {
        const validation = Validation.validate(JobCategoriesValidation.GETSCHEMA, req)
        const jobCategories = await prismaClient.jobCategories.findUnique({
            where: {
                id: validation.id
            }
        })
        if (!jobCategories) {
            throw new ResponseError(404, "job categories not found")
        }

        return model.toJobCategoriesResponse(jobCategories)
    }
}