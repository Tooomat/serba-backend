import { prismaClient } from "../application/database";
import { ResponseError } from "../error/service-response.error";
import { buildPaging, Pagable } from "../model/paging.model";
import { 
    acceptedApplicantResponse,
    createJobRequest, 
    jobDetailResponse, 
    jobListPublicResponse, 
    jobListResponse, 
    jobResponse, 
    locationJobJson, 
    queryListJob, 
    querySearchJob, 
    toJobDetailResponse, 
    toJobListPublicResponse, 
    toJobListResponse, 
    toJobResponse,
    updateJobRequest
} from "../model/jobs.model";
import { getCyclePrimaryImage } from "../utils/image.utils";
import { JobsValidation } from "../validation/jobs.validation";
import { Validation } from "../validation/validation";
import { locationUtils } from "../utils/location.utils";
import { timeUtils } from "../utils/time.utils";
import { Prisma } from "../generated/prisma/client";
import { formater } from "../utils/formater.utils";

export class JobsService { 
    static async create(jobProviderId: string, req: createJobRequest): Promise<jobResponse> {
        const validate = Validation.validate(JobsValidation.CREATE_SCHEMA, req)

        return await prismaClient.$transaction(async (tx) => {
            const provider = await tx.user.findUnique({
                where: {
                    id: jobProviderId
                },
                select: {
                    id: true,
                    status: true
                }
            }) 
            if (!provider) {
                throw new ResponseError(
                    404,
                    "Job provider not found"
                )
            }

            // if (provider.status === 'PENDING_VERIFICATION') {
            //     throw new ResponseError(
            //         400,
            //         "Please complete your account verification first"
            //     )
            // }
            
            const address = await tx.address.findUnique({
                where: {
                    id: validate.addressId,
                    userId: jobProviderId
                },
                select: {
                    id: true,
                    lat: true,
                    lng: true,
                    street: true,
                    locations: true
                }
            })
            if (!address) {
                throw new ResponseError(
                    404,
                    "Address not found"
                )
            }

            const jobData: Prisma.JobCreateInput = {
                jobProvider: { connect: { id: jobProviderId } },
                address: { connect: { id: validate.addressId } },
                title: validate.title,
                description: validate.description,
                level: validate.level,
                type: validate.type,
                required: validate.required,
                jobSite: validate.jobSite,
                status: validate.status,
                locations: {
                    lat: address.lat.toString(),
                    lng: address.lng.toString(),
                    street: address.street,
                    masterLocations: address.locations
                },
            }
            if (validate.introduction !== undefined) jobData.introduction = validate.introduction

            if (validate.budgetMin !== undefined) jobData.budgetMin = validate.budgetMin
            if (validate.budgetMax !== undefined) jobData.budgetMax = validate.budgetMax
            if (validate.budgetType !== undefined) jobData.budgetType = validate.budgetType

            if (validate.startTime !== undefined) jobData.startTime = timeUtils.parseTimeToDate(validate.startTime)
            if (validate.endTime !== undefined) jobData.endTime = timeUtils.parseTimeToDate(validate.endTime)
            if (validate.startDate !== undefined) jobData.startDate = validate.startDate
            if (validate.endDate !== undefined) jobData.endDate = validate.endDate

            const job = await tx.job.create({
                data: jobData
            })

            const categories = await tx.jobCategory.findMany({
                where: {
                    id: {
                        in: validate.jobCategoriesId
                    }
                },
                select: {
                    id: true
                }
            })
            if (categories.length !== validate.jobCategoriesId.length) {
                throw new ResponseError(
                    404,
                    "One or more job categories not found"
                )
            }

            await tx.categoriesMapping.createMany({
                data: validate.jobCategoriesId.map((categoryId) => ({
                    jobCategoryId: categoryId,
                    jobId: job.id
                }))
            })
            
            return toJobResponse(job)
        })
    }

    static async listPublicJob(query: queryListJob): Promise<Pagable<jobListPublicResponse>> {
        const validate = Validation.validate(JobsValidation.LIST_JOB_SCHEMA, query)

        const skip = (validate.page - 1) * validate.size

        const [jobs, totalData] = await prismaClient.$transaction([
            prismaClient.job.findMany({
                where: {
                    isPublic: true,
                    status: 'OPEN'
                },
                include: {
                    categoriesMapping: {
                        include: {
                            jobCategory: true
                        }
                    }
                },
                orderBy: {
                    createdAt: 'desc'
                },
                take: validate.size,
                skip: skip
            }),
            
            prismaClient.job.count({
                where: {
                    isPublic: true,
                    status: 'OPEN'
                },
            })
        ])

        const totalPage = Math.max(1, Math.ceil(totalData / validate.size))

        // ALGORITMA 
        // 1. Image kategori dipakai berurutan (image1 → image2 → image3).
        // 2. Kalau kategori A sudah habis 1-2-3,
        // dan job punya kategori B juga,
        // maka pakai kategori B image1.
        // 3. semisal job berikutnya kategori C D, maka akan mengambil kategori C image1
        // 4. Kalau job berikutnya cuma kategori A lagi,
        // maka kembali ke kategori A image1 (reset siklus).

        // ALGORITMA CYCLE IMAGE
        // Track: { categoryId: currentImageIndex }
        const categoryImageTracker: Map<string, number> = new Map()

        const datas = jobs.map(job => {
            const categories = job.categoriesMapping.map(cm => cm.jobCategory)
            
            const primaryImage = getCyclePrimaryImage(categories, categoryImageTracker)
            
            return toJobListPublicResponse(job, primaryImage)
        })

        return {
            data: datas,
            paging: buildPaging(
                validate.page,
                validate.size,
                totalData,
                totalPage
            )
        }

    }

    static async get(userId: string, jobId: string): Promise<jobDetailResponse> {
        //multiple joins table
        const job = await prismaClient.job.findUnique({
            where: {
                id: jobId
            },
            include: {
                jobProvider: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        username: true,
                        profilePictUrl: true,
                        isEmailVerified: true,
                        isPhoneVerified: true,
                    }
                },
                categoriesMapping: { 
                    include: {
                        jobCategory: {
                            select: {
                                id: true,
                                name: true
                            }
                        }
                    }
                }
            }
        })
        if (!job) {
            throw new ResponseError(404, "Job not found")
        }

        const isProvider = job.jobProvider.id === userId
        
        const categories = job.categoriesMapping.map(
            (mapping) => mapping.jobCategory
        )

        let worker: acceptedApplicantResponse[] | undefined
        if (isProvider) {
            const jobApplications = await prismaClient.jobApplication.findMany({
                where: {
                    AND: [
                        { jobId: jobId },
                        { status: 'ACCEPTED' }
                    ]
                },
                include: {
                    worker: {
                        select: {
                            id: true,
                            username: true,
                            firstName: true,
                            lastName: true,
                            profilePictUrl: true
                        }
                    }
                },
                orderBy: {
                    appliedAt: 'desc'
                }
            })

            worker = jobApplications.map(jobApplication => ({
                id: jobApplication.worker.id,
                username: jobApplication.worker.username,
                name: [jobApplication.worker.firstName, jobApplication.worker.lastName].filter(Boolean).join(' '),
                profilePictUrl: jobApplication.worker.profilePictUrl
            }))
        }

        return toJobDetailResponse(
            job, 
            job.jobProvider, 
            categories, 
            isProvider,
            worker
        )
    }

    static async listMyCreatedJobs(jobProviderId: string, query: queryListJob): Promise<Pagable<jobListResponse>> {
        const validate = Validation.validate(JobsValidation.LIST_JOB_SCHEMA, query)
        
        const skip = (validate.page - 1) * validate.size

        const [jobsProvider, totalData] = await prismaClient.$transaction([
            prismaClient.job.findMany({
                where: {
                    jobProviderId: jobProviderId
                },
                include: {
                    jobProvider: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            username: true,
                            profilePictUrl: true,
                            isEmailVerified: true,
                            isPhoneVerified: true
                        }
                    },
                    categoriesMapping: {
                        include: {
                            jobCategory: {
                                select: {
                                    id: true,
                                    name: true
                                }
                            }
                        }
                    }
                },
                orderBy: {
                    createdAt: 'desc'
                },
                take: validate.size,
                skip: skip
            }),
            
            prismaClient.job.count({ 
                where: {
                    jobProviderId: jobProviderId
                }
            })
        ])

        const totalPage = Math.max(1, Math.ceil(totalData / validate.size))
        const datas: jobListResponse[] = jobsProvider.map((job) => {
            const isProvider = job.jobProvider.id === jobProviderId
        
            const categories = job.categoriesMapping.map(
                (mapping) => mapping.jobCategory
            )

            return toJobListResponse(
                job,
                job.jobProvider,
                categories,
                isProvider
            )
        })

        return {
            data: datas,
            paging: buildPaging(
                validate.page,
                validate.size,
                totalData,
                totalPage
            )
        }
    }
    
    static async searchJobs(jobSeekerId: string, query: querySearchJob): Promise<Pagable<jobListResponse>> {
        const validate = Validation.validate(JobsValidation.SEARCH_JOB_SCHEMA, query)

        const skip = (validate.page - 1) * validate.size
        const filters: any[] = []

        // Base filter: only public and open jobs (unless status specified)
        filters.push({
            isPublic: true
        })

        // Filter by jobCategoriesId - ONLY ADD IF EXISTS
        if (validate.jobCategoriesId && validate.jobCategoriesId.length > 0) {
            filters.push({
                categoriesMapping: {
                    some: {
                        jobCategoryId: {
                            in: validate.jobCategoriesId
                        }
                    }
                }
            })    
        }

        // Filter by title - ONLY ADD IF EXISTS
        if (validate.title) {
            filters.push({
                OR: [
                    {
                        title: {
                            contains: validate.title,
                            mode: 'insensitive'
                        }
                    },
                    {
                        introduction: {
                            contains: validate.title,
                            mode: 'insensitive'
                        }
                    }
                ]
            })
        }

        // Filter by level - ONLY ADD IF EXISTS
        if (validate.level && validate.level.length > 0) {
            filters.push({
                level: {
                    hasSome: validate.level
                }
            })
        }

        // Filter by status - ONLY ADD IF EXISTS
        if (validate.status) {
            filters.push({
                status: validate.status
            })
        }

        // Filter by location - Build conditionally
        if (validate.provinceId) {
            filters.push({
                locations: {
                    path: ["masterLocations", "province", "id"],
                    equals: validate.provinceId
                }
            })
        }

        if (validate.cityId) {
            filters.push({
                locations: {
                    path: ["masterLocations", "city", "id"],
                    equals: validate.cityId
                }
            })
        }

        if (validate.districtId) {
            filters.push({
                locations: {
                    path: ["masterLocations", "district", "id"],
                    equals: validate.districtId
                }
            })
        }

        if (validate.subdistrictId) {
            filters.push({
                locations: {
                    path: ["masterLocations", "subdistrict", "id"],
                    equals: validate.subdistrictId
                }
            })
        }

        const [jobs, totalData, jobSeekerAddress] = await prismaClient.$transaction([
            prismaClient.job.findMany({
                where: {
                    AND: filters
                },
                include: {
                    jobProvider: true,
                    categoriesMapping: {
                        include: {
                            jobCategory: true
                        }
                    }
                },
                orderBy: {
                    createdAt: 'desc',
                },
                take: validate.size,
                skip: skip
            }),

            prismaClient.job.count({
                where: {
                    AND: filters
                }
            }),

            prismaClient.address.findFirst({
                where: { 
                    userId: jobSeekerId, 
                    isPrimary: true 
                },
                select: { 
                    lat: true, 
                    lng: true 
                }
            })
        ])

        const userLat = jobSeekerAddress ? Number(jobSeekerAddress.lat) : null
        const userLng = jobSeekerAddress ? Number(jobSeekerAddress.lng) : null

        const totalPage = Math.max(1, Math.ceil(totalData / validate.size))
        const datas: jobListResponse[] = jobs.map(job => {
            const isProvider = job.jobProvider.id === jobSeekerId
            const categories = job.categoriesMapping.map((mapping) => mapping.jobCategory)

            let distance: string | null = null
            if (userLat && userLng) {
                const jobLocations = locationUtils.parseJsonLocation<locationJobJson>(job.locations)
                if (jobLocations.lat && jobLocations.lng) {
                    distance = locationUtils.formatDistance(
                        userLat,
                        userLng,
                        Number(jobLocations.lat),
                        Number(jobLocations.lng)
                    )
                }
            }

            return toJobListResponse(
                job,
                job.jobProvider,
                categories,
                isProvider,
                distance
            )
        })

        return {
            data: datas,
            paging: buildPaging(
                validate.page,
                validate.size,
                totalData,
                totalPage
            )
        }
    }

    static async update(userId: string, jobId: string, req: updateJobRequest): Promise<jobResponse> {
        const validate = Validation.validate(JobsValidation.UPDATE_SCHEMA, req)

        return await prismaClient.$transaction(async (tx) => {
            const job = await tx.job.findUnique({
                where: {
                    id: jobId
                },
                include: {
                    jobProvider: {
                        select: {
                            id: true
                        }
                    }
                }
            })
            if (!job) {
                throw new ResponseError(404, "Job not found")
            }
            if (job.status === 'CLOSED') {
                throw new ResponseError(400, "Status job closed, cannot be to update")
            }
            if (job.jobProvider.id !== userId) {
                throw new ResponseError(403, "Not the owner job")
            }

            const jobData: Prisma.JobUpdateInput = {}
            if (validate.addressId !== undefined) {
                const address = await tx.address.findUnique({
                    where: {
                        id: validate.addressId
                    },
                    select: {
                        id: true,
                        lat: true,
                        lng: true,
                        street: true,
                        locations: true
                    }
                })
                if (!address) {
                    throw new ResponseError(404, "Address not found")
                }
                jobData.locations = {
                    lat: address.lat.toString(),
                    lng: address.lng.toString(),
                    street: address.street,
                    masterLocations: address.locations
                }
                jobData.address = { connect: { id: validate.addressId } }
            }

            if (validate.jobCategoriesId !== undefined) {
                const jobCategories = await tx.jobCategory.findMany({
                    where: {
                        id: {
                            in: validate.jobCategoriesId
                        }
                    },
                    select: {
                        id: true
                    }
                })
                if (jobCategories.length !== validate.jobCategoriesId.length) {
                    throw new ResponseError(404, "One or more job categories not found")
                }
                
                await tx.categoriesMapping.deleteMany({
                    where: {
                        jobId: jobId
                    }
                })
                
                await tx.categoriesMapping.createMany({
                    data: validate.jobCategoriesId.map(categoryId => ({
                        jobId: jobId,
                        jobCategoryId: categoryId
                    }))
                })                
            }
            if (validate.required !== undefined) {
                const countAcceptedJobApplications = await tx.jobApplication.count({
                    where: {
                        AND: [
                            { jobId: jobId },
                            { status: 'ACCEPTED' }
                        ]
                    }
                })
                if (validate.required < countAcceptedJobApplications) {
                    throw new ResponseError(400, "Required cannot under of accepted job application")
                }

                jobData.required = validate.required
            }
            if (validate.title !== undefined) jobData.title = validate.title
            if (validate.introduction !== undefined) jobData.introduction = validate.introduction
            if (validate.description !== undefined) jobData.description = validate.description
            if (validate.level !== undefined) jobData.level = validate.level
            if (validate.type !== undefined) jobData.type = validate.type
            if (validate.jobSite !== undefined) jobData.jobSite = validate.jobSite
            if (validate.budgetMin !== undefined) jobData.budgetMin = validate.budgetMin
            if (validate.budgetMax !== undefined) jobData.budgetMax = validate.budgetMax
            if (validate.budgetType !== undefined) jobData.budgetType = validate.budgetType
            if (validate.status !== undefined) jobData.status = validate.status
            if (validate.startTime !== undefined) jobData.startTime = timeUtils.parseTimeToDate(validate.startTime)
            if (validate.endTime !== undefined) jobData.endTime = timeUtils.parseTimeToDate(validate.endTime)
            if (validate.startDate !== undefined) jobData.startDate = validate.startDate
            if (validate.endDate !== undefined) jobData.endDate = validate.endDate

            const newJob = await tx.job.update({
                where: {
                    id: jobId
                },
                data: jobData
            })

            return toJobResponse(newJob)
        })
    }

    static async delete(userId: string, jobId: string): Promise<void> {
        return await prismaClient.$transaction(async (tx) => {
            const job = await tx.job.findUnique({
                where: {
                    id: jobId
                },
                include: {
                    jobProvider: {
                        select: {
                            id: true
                        }
                    }
                }
            })
            if (!job) {
                throw new ResponseError(404, "Job not found")
            }
            if (job.jobProvider.id !== userId) {
                throw new ResponseError(403, "Not the owner job")
            }
            if (job.status === 'CLOSED') {
                throw new ResponseError(400, "Job status closed, cannot delete job")
            }

            const acceptedCount = await tx.jobApplication.count({
                where: { jobId: jobId, status: 'ACCEPTED' }
            })

            if (acceptedCount > 0) {
                throw new ResponseError(400, "Cannot delete job with accepted applicants")
            }

            await tx.job.delete({
                where: {
                    id: job.id
                }
            })
        })
    }
}