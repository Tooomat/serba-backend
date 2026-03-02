import { Job, JobCategory, User } from "../generated/prisma/client"
import { parseJsonLocation } from "../utils/location.utils"
import { priceUrgentJobProvider } from "../utils/price.utils"
import { countStartDateToEndDate, getTimeAgo, parseDateToDay } from "../utils/time.utils"
import { Decimal } from "@prisma/client/runtime/client"
import { JobFormatters } from "../utils/formater.utils"
import { config } from "../config/env"

type locationJson = {
    lat: Decimal
    lng: Decimal
    street: string
    postalCode: string
    masterLocations: {
        subdistrict: {
            id: string
            name: string
            code: string
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
}

// ================================== GET LIST LANDING PAGE ==================================
export type jobListPublicResponse = {
    id: string
    jobProviderId: string
	addressId: string
	isPublic: boolean
	locations: locationJson
    title: string
    type: string
    jobSite: string
    budgetMin?: number | null
    budgetMax?: number | null
    budgetType?: string | null
    status: string 
    jobAge: string
    primaryImage: string
}

export function toJobListPublicResponse(job: Job, image: string): jobListPublicResponse {
    const locations = parseJsonLocation<locationJson>(job.locations)
    const jobAge = getTimeAgo(job.createdAt, 'en')
    
    const baseUrl = config.APP_URL.replace(/\/+$/, '')
    const pathImage = `${baseUrl}${image.startsWith('/') ? '' : '/'}${image}`

    return {
        id: job.id,
        jobProviderId: job.jobProviderId,
        addressId: job.addressId,
        isPublic: job.isPublic,
        locations: locations,
        title: job.title,
        type: JobFormatters.type(job.type),
        jobSite: JobFormatters.site(job.jobSite),
        budgetMin: job.budgetMin? priceUrgentJobProvider(job.type, job.budgetMin) : null,
        budgetMax: job.budgetMax? priceUrgentJobProvider(job.type, job.budgetMax) : null,
        budgetType: job.budgetType ? JobFormatters.budgetType(job.budgetType) : null,
        status: JobFormatters.status(job.status),
        jobAge: jobAge,
        primaryImage: pathImage
    }
}

// ================================== CREATE & UPDATE==================================
export type createJobRequest = {
    addressId: string
    jobCategoriesId: string[]
    title: string
    introduction: string
    description: string
    level: string[]
    type: string
    required: number
    jobSite: string
    budgetMin?: number
    budgetMax?: number
    budgetType?: string
    status: string
    startTime?: string   
    endTime?: string        
    startDate?: string
    endDate?: string
}

export type updateJobRequest = {
    addressId?: string | undefined
    jobCategoriesId?: string[] | undefined
    title?: string | undefined
    introduction?: string | undefined
    description?: string | undefined
    level?: string[] | undefined
    type?: string | undefined
    required?: number | undefined
    jobSite?: string | undefined
    budgetMin?: number | undefined
    budgetMax?: number | undefined
    budgetType?: string | undefined
    status?: string | undefined
    startTime?: string | undefined   
    endTime?: string | undefined         
    startDate?: string | undefined
    endDate?: string | undefined
}

export type jobResponse = {
    id: string
    jobProviderId: string
	addressId: string
	isPublic: boolean
	locations: locationJson
    title: string
    introduction?: string | null
    description: string
    level: string[]
    type: string
    required: number
    jobSite: string
    budgetMin?: number | null
    budgetMax?: number | null
    budgetType?: string | null
    status: string 
    startTime?: string | null 
    endTime?: string     
    startDate?: Date | null
    endDate?: Date | null
    createdAt: Date
    updatedAt?: Date | null
}

export function toJobResponse(job: Job): jobResponse{
    const locations = parseJsonLocation<locationJson>(job.locations)
    
    const response: jobResponse = {
        id: job.id,
        jobProviderId: job.jobProviderId,
        addressId: job.addressId,
        isPublic: job.isPublic,
        locations: locations,
        title: job.title,
        introduction: job.introduction,
        description: job.description,
        level: job.level.map(JobFormatters.level),
        type: JobFormatters.type(job.type),
        required: job.required,
        jobSite: JobFormatters.site(job.jobSite),
        budgetMin: job.budgetMin? priceUrgentJobProvider(job.type, job.budgetMin) : null,
        budgetMax: job.budgetMax? priceUrgentJobProvider(job.type, job.budgetMax) : null,
        budgetType: job.budgetType ? JobFormatters.budgetType(job.budgetType) : null,
        status: JobFormatters.status(job.status), 
        startTime: job.startTime
            ? job.startTime.toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: true
            })
            : null, 
        endTime: job.endTime
            ? job.endTime.toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: true
            })
            : "Until End",   
        startDate: job.startDate,
        endDate: job.endDate,
        createdAt: job.createdAt,
        updatedAt: job.updatedAt
    }
    
    return response
}

// ======================================== GET ========================================
export type acceptedApplicantResponse = {
    id: string
    name: string
    username: string
    profilePictUrl?: string | null
}
export type jobDetailResponse = {
    id: string
    user: {
        jobProvider: {
            id: string
            name: string
            username: string
            profilePictUrl?: string | null
            isEmailVerified: boolean
            isPhoneVerified: boolean
        }
    }
    acceptedApplicant?: acceptedApplicantResponse[] | null
    addressId: string
    isProvider: boolean
    isPublic: boolean
    locations: locationJson
    title: string
    introduction?: string | null
    description: string
    level: string[]
    required: number
    type: string
    jobSite: string
    budgetMin?: number | null
    budgetMax?: number | null
    budgetType?: string | null
    status: string
    applicationsCount: number
    dayOfWeekStart?: string | null
    startTime?: string | null
    endTime?: string | null
    estimatedDurationDays?: string | null
    categories: Array<{
        id: string
        name: string
    }>
    createdAt: Date
    updatedAt?: Date | null
}

export function toJobDetailResponse(
    job: Job, 
    user: User, 
    categories: JobCategory[], 
    isProvider: boolean,
    acceptedApplicants?: acceptedApplicantResponse[] | null
): jobDetailResponse {
    const locations = parseJsonLocation<locationJson>(job.locations)

    let estimatedDurationDays: string | null = null;
    if (job.startDate && job.endDate) {
        estimatedDurationDays = countStartDateToEndDate(job.startDate, job.endDate);
    }

    const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ')
    
    const response: jobDetailResponse = {
        id: job.id,
        user: {
            jobProvider: {
                id: user.id,
                name: fullName,
                username: user.username,
                profilePictUrl: user.profilePictUrl,
                isEmailVerified: user.isEmailVerified,
                isPhoneVerified: user.isPhoneVerified
            }
        },
        addressId: job.addressId,
        isProvider: isProvider,
        isPublic: job.isPublic,
        locations: locations,
        title: job.title,
        introduction: job.introduction,
        description: job.description,
        level: job.level.map(JobFormatters.level),
        required: job.required,
        type: JobFormatters.type(job.type),
        jobSite: JobFormatters.site(job.jobSite),
        budgetMin: job.budgetMin ? priceUrgentJobProvider(job.type, job.budgetMin) : null,
        budgetMax: job.budgetMax ? priceUrgentJobProvider(job.type, job.budgetMax) : null,
        budgetType: job.budgetType ? JobFormatters.budgetType(job.budgetType) : null,
        status: JobFormatters.status(job.status),
        applicationsCount: job.applicationCount,
        dayOfWeekStart: job.startTime ? parseDateToDay(job.startTime) : null,
        startTime: job.startTime
            ? job.startTime.toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: true
            })
            : null,
        endTime: job.endTime
            ? job.endTime.toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: true
            })
            : "Until end",
        estimatedDurationDays: estimatedDurationDays,
        categories: categories.map(c => ({
            id: c.id,
            name: c.name
        })),
        createdAt: job.createdAt,
        updatedAt: job.updatedAt
    }

    if (isProvider) {
        response.acceptedApplicant = acceptedApplicants ?? []
    }
    
    return response
}

// ======================================== GET ALL ========================================
export type queryListJob = {
    page: number
    size: number
}

export type querySearchJob = {
    jobCategoriesId?: string[] | undefined
    title?: string | undefined
    level?: string[] | undefined
    status?: string | undefined
    provinceId?: string | undefined
    cityId?: string | undefined
    districtId?: string | undefined
    subdistrictId?: string | undefined
    page: number
    size: number
}

export type jobListResponse = {
    id: string
    user: {
        jobProvider: {
            id: string
            name: string
            username: string
            profilePictUrl?: string | null
            isEmailVerified: boolean
            isPhoneVerified: boolean
        }
    }
    title: string
    introduction?: string | null
    isProvider: boolean
    isPublic: boolean
    locations: locationJson
    type: string
    jobSite: string
    budgetMin?: number | null
    budgetMax?: number | null
    budgetType?: string | null
    status: string
    jobAge: string
    distance?: string | null
    categories: Array<{
        id: string
        name: string
    }>
}

export function toJobListResponse(
    job: Job, 
    user: User, 
    categories: JobCategory[], 
    isProvider: boolean, 
    distance?: string | null
): jobListResponse {
    const jobLocations = parseJsonLocation<locationJson>(job.locations)
    const jobAge = getTimeAgo(job.createdAt, 'en')
    const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ')

    const response: jobListResponse = {
        id: job.id,
        user: {
            jobProvider: {
                id: user.id,
                name: fullName,
                username: user.username,
                profilePictUrl: user.profilePictUrl,
                isEmailVerified: user.isEmailVerified,
                isPhoneVerified: user.isPhoneVerified
            }
        },
        title: job.title,
        introduction: job.introduction,
        isProvider: isProvider,
        isPublic: job.isPublic,
        locations: jobLocations,
        type: JobFormatters.type(job.type),
        jobSite: JobFormatters.site(job.jobSite),
        budgetMin: job.budgetMin ? priceUrgentJobProvider(job.type, job.budgetMin) : null,
        budgetMax: job.budgetMax ? priceUrgentJobProvider(job.type, job.budgetMax) : null,
        budgetType: job.budgetType ? JobFormatters.budgetType(job.budgetType) : null,
        status: JobFormatters.status(job.status),
        jobAge: jobAge,
        distance: distance ?? null,
        categories: categories.map(c => ({
            id: c.id,
            name: c.name
        })),
    }

    return response
}