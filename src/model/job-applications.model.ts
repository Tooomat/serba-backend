import { Address, Job, JobApplication, User } from "../generated/prisma/client"
import { jobApplicationFormater, JobFormatters } from "../utils/formater.utils"
import { parseJsonLocation } from "../utils/location.utils"
import { getTimeAgo, parseDateToDay } from "../utils/time.utils"

type locationJson = {
    subdistrict: {
        id: string
        name: string
    },
    district: {
        id: string
        name: string
        code: string
    },
    city: {
        id: string
        name: string
        code: string
    },
    province: {
        id: string
        name: string
        code: string
    }
}

// ================================ CREATE ================================
export type createJobApplicationsRequest = {
    coverLetter?: string | undefined
}

export type jobApplicationResponse = {
    id: string
    status: string
    job: {
        id: string
        applicationCount: number
    }
    coverLetter?: string | null
    appliedAt?: string | null
}   

export function toJobApplicationsResponse(
    jobApp: Pick<JobApplication, 'id' | 'status' | 'coverLetter' | 'appliedAt'>, 
    job: Pick<Job, 'id' | 'applicationCount'>
): jobApplicationResponse {
    return {
        id: jobApp.id,
        status: jobApp.status,
        job: {
            id: job.id,
            applicationCount: job.applicationCount
        },
        coverLetter: jobApp.coverLetter,
        appliedAt: `Applied on ${parseDateToDay(jobApp.appliedAt)}`
    }
}

// ================================ UPDATE ================================
export type updateJobApplicationRequest = {
    jobMessage: string
    rejectedGlobalMessage: string
    status: string
}
export type updateJobApplicationResponse = {
    id: string
    status: string
    acceptedAt?: Date | null
    rejectedAt?: Date | null
    user: {
        workerId: string
        name: string
    }
    job: {
        id: string
        title: string
        status: string
    }
}

export function toUpdateJobApplicationResponse(
    jobApp: Pick<JobApplication, 'id' | 'status' | 'acceptedAt' | 'rejectedAt'>, 
    user: Pick<User, 'id' | 'firstName' | 'lastName'>, 
    job: Pick<Job, 'id' | 'title' | 'status'>
): updateJobApplicationResponse {
    return {
        id: jobApp.id,
        status: jobApplicationFormater.status(jobApp.status),
        acceptedAt: jobApp.acceptedAt ?? null,
        rejectedAt: jobApp.rejectedAt ?? null,
        user: {
            workerId: user.id,
            name: user.lastName ? user.firstName.concat(" ", user.lastName) : user.firstName
        },
        job: {
            id: job.id,
            title: job.title,
            status: JobFormatters.status(job.status)
        }
    }
}

// ================================ GET ================================
export type getDetailJobApplicationResponse = {
    worker?: {
        id: string
        name: string
        profilePictUrl?: string | null,
        email: string
        phone: string
    } | null
    jobProvider?: {
        id: string
        name: string
        profilePictUrl?: string | null,
        email: string
    } | null
    job: {
        id: string
        title: string
        status: string
        jobSite: string,
        level: string[]
        isProvider: boolean,
        locations: locationJson
    }
    id: string
    status: string
    coverLetter?: string | null
    appliedAt?: string | null 
    acceptedAt?: string | null
    rejectedAt?: string | null
    reviewedAt?: string | null
}

export function toGetDetailJobApplicationResponse(
    user: Pick<User, 'id' | 'firstName' | 'lastName' | 'profilePictUrl' | 'email' | 'phone'>, 
    job: Pick<Job, 'id' | 'title' | 'status' | 'jobSite' | 'level' | 'locations'>, 
    jobApp: Pick<JobApplication, 'id' | 'status' | 'coverLetter' | 'appliedAt' | 'acceptedAt' | 'rejectedAt' | 'reviewedAt'>, 
    isJobProvider: boolean
): getDetailJobApplicationResponse {
    const locations = parseJsonLocation<locationJson>(job.locations)
    const response: getDetailJobApplicationResponse = {
        job: {
            id: job.id,
            title: job.title,
            status: JobFormatters.status(job.status),
            jobSite: job.jobSite,
            level: job.level,
            isProvider: isJobProvider,
            locations: locations
        },
        id: jobApp.id,
        status: jobApplicationFormater.status(jobApp.status),
        coverLetter: jobApp.coverLetter
    }

    if (isJobProvider) {
        if (jobApp.appliedAt) {
            response.appliedAt = `Applicant applied on ${parseDateToDay(jobApp.appliedAt)}`
        }
        if (jobApp.acceptedAt) {
            response.acceptedAt = `Accepted by you on ${parseDateToDay(jobApp.acceptedAt)}`
        }
        if (jobApp.rejectedAt) {
            response.rejectedAt = `Rejected by you on ${parseDateToDay(jobApp.rejectedAt)}`
        }
        if (jobApp.reviewedAt) {
            response.reviewedAt = `Reviewed by you on ${parseDateToDay(jobApp.reviewedAt)}`
        }
        response.worker = {
            id: user.id,
            name: user.lastName ? user.firstName.concat(" ", user.lastName) : user.firstName,
            profilePictUrl: user.profilePictUrl,
            email: user.email,
            phone: user.phone
        }
    }

    if (!isJobProvider) {
        if (jobApp.appliedAt) {
            response.appliedAt = `Applied on ${parseDateToDay(jobApp.appliedAt)}`
        }
        if (jobApp.acceptedAt) {
            response.acceptedAt = `Accepted by ${user.lastName ? user.firstName.concat(" ", user.lastName) : user.firstName} on ${parseDateToDay(jobApp.acceptedAt)}`
        }
        if (jobApp.rejectedAt) {
            response.rejectedAt = `Rejected by ${user.lastName ? user.firstName.concat(" ", user.lastName) : user.firstName} on ${parseDateToDay(jobApp.rejectedAt)}`
        }
        if (jobApp.reviewedAt) {
            response.reviewedAt = `Reviewed by ${user.lastName ? user.firstName.concat(" ", user.lastName) : user.firstName} on ${parseDateToDay(jobApp.reviewedAt)}`
        }
        response.jobProvider = {
            id: user.id,
            name: user.lastName ? user.firstName.concat(" ", user.lastName) : user.firstName,
            profilePictUrl: user.profilePictUrl,
            email: user.email
        }
    }

    return response        
}

// ================================ GET LIST ================================
export type getListJobApplicationQuery = {
    status?: string | undefined
    name?: string | undefined
    page: number
    size: number
}

export type getListJobApplicationResponse = {
    worker?: {
        id: string
        name: string
        profilePictUrl?: string | null
    } | null
    jobProvider?: {
        id: string
        name: string
        profilePictUrl?: string | null
    } | null
    job?: {
        id: string
        title: string
        jobAge: string
    } | null
    id: string
    status: string
    appliedAt?: string | null
    reviewedAt?: string | null
    acceptedAt?: string | null
    rejectedAt?: string | null
}

export function toGetListJobApplicationResponse(
    user: Pick<User, 'id' | 'firstName' | 'lastName' | 'profilePictUrl'>, 
    job: Pick<Job, 'id' | 'title' | 'createdAt'>, 
    jobApp: Pick<JobApplication, 'id' | 'status' | 'appliedAt' | 'acceptedAt' | 'rejectedAt' | 'reviewedAt'>, 
    isProvider: boolean
): getListJobApplicationResponse {

    const response: getListJobApplicationResponse = {
        id: jobApp.id,
        status: jobApplicationFormater.status(jobApp.status),
    }

    if (isProvider) {
        response.worker = {
            id: user.id,
            name: user.lastName ? user.firstName.concat(" ", user.lastName) : user.firstName,
            profilePictUrl: user.profilePictUrl
        }
        if (jobApp.appliedAt) {
            response.appliedAt = `Applicant applied on ${parseDateToDay(jobApp.appliedAt)}`
        }
        if (jobApp.acceptedAt) {
            response.acceptedAt = `Accepted by you on ${parseDateToDay(jobApp.acceptedAt)}`
        }
        if (jobApp.rejectedAt) {
            response.rejectedAt = `Rejected by you on ${parseDateToDay(jobApp.rejectedAt)}`
        }
        if (jobApp.reviewedAt) {
            response.reviewedAt = `Reviewed by you on ${parseDateToDay(jobApp.reviewedAt)}`
        }
    }

    if (!isProvider) {
        response.job = {
            id: job.id,
            title: job.title,
            jobAge: getTimeAgo(job.createdAt, 'en')
        },
        response.jobProvider = {
            id: user.id,
            name: user.lastName ? user.firstName.concat(" ", user.lastName) : user.firstName,
            profilePictUrl: user.profilePictUrl
        }
        if (jobApp.appliedAt) {
            response.appliedAt = `Applied on ${parseDateToDay(jobApp.appliedAt)}`
        }
        if (jobApp.acceptedAt) {
            response.acceptedAt = `Accepted by ${user.lastName ? user.firstName.concat(" ", user.lastName) : user.firstName} on ${parseDateToDay(jobApp.acceptedAt)}`
        }
        if (jobApp.rejectedAt) {
            response.rejectedAt = `Rejected by ${user.lastName ? user.firstName.concat(" ", user.lastName) : user.firstName} on ${parseDateToDay(jobApp.rejectedAt)}`
        }
        if (jobApp.reviewedAt) {
            response.reviewedAt = `Reviewed by ${user.lastName ? user.firstName.concat(" ", user.lastName) : user.firstName} on ${parseDateToDay(jobApp.reviewedAt)}`
        }
    }
    return response  
}