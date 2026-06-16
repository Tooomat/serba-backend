import { Bookmarks, Job } from "../generated/prisma/client"

export type addBookmarksResponse = {
    id: string
}

export type listBookmarksQuery = {
    page: number
    size: number
}
export type listBookmarksResponse = {
    id: string
    job: {
        id: string
        title: string
        budgetMin?: number | null
        budgetMax?: number | null
        budgetType?: string | null
        jobSite: string 
        type: string
        createdAt: Date
    }
}
export function toListBookmarksResponse(
    bookmark: Pick<Bookmarks, 'id'>,
    job: Pick<Job, 'id' | 'title' | 'budgetMin' | 'budgetMax' | 'budgetType' | 'jobSite' | 'type' | 'createdAt'>
): listBookmarksResponse {
    return {
        id: bookmark.id,
        job: {
            id: job.id,
            title: job.title,
            budgetMin: job.budgetMin,
            budgetMax: job.budgetMax,
            budgetType: job.budgetType,
            jobSite: job.jobSite,
            type: job.type,
            createdAt: job.createdAt
        }
    }
}