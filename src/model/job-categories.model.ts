import { JobCategories } from "../generated/prisma/client"

export type jobCategoriesResponse = {
    id: string
    code: string
    name: string
    isActive: boolean
}

export type getJobCaregoryRequest = {
    id: string
}

export function toJobCategoriesResponse(jobCategory: JobCategories): jobCategoriesResponse {
    return {
        id: jobCategory.id,
        code: jobCategory.code,
        name: jobCategory.name,
        isActive: jobCategory.isActive
    }
}
