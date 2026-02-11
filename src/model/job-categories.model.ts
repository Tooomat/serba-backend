import { JobCategory } from "../generated/prisma/client"

export type jobCategoryResponse = {
    id: string
    code: string
    name: string
    isActive: boolean
}

export type getJobCaregoryRequest = {
    id: string
}

export function toJobCategoryResponse(jobCategory: JobCategory): jobCategoryResponse {
    return {
        id: jobCategory.id,
        code: jobCategory.code,
        name: jobCategory.name,
        isActive: jobCategory.isActive
    }
}
