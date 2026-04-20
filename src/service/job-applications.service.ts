import { randomUUID } from "crypto";
import { prismaClient } from "../application/database";
import { ResponseError } from "../error/service-response.error";
import { buildPaging, Pagable } from "../model/paging.model";
import { 
    createJobApplicationsRequest, 
    getDetailJobApplicationResponse, 
    getListJobApplicationQuery, 
    getListJobApplicationResponse, 
    jobApplicationResponse, 
    toGetDetailJobApplicationResponse, 
    toGetListJobApplicationResponse, 
    toJobApplicationsResponse,
    toUpdateJobApplicationResponse,
    updateJobApplicationRequest,
    updateJobApplicationResponse
} from "../model/job-applications.model";
import { JobApplicationsValidation } from "../validation/job-applications.validation";
import { Validation } from "../validation/validation";
import { Prisma } from "../generated/prisma/client";
import { enqueueManyNotifications, enqueueNotification } from "../queues/notifications/notification.helper";
import { enqueueEmail } from "../queues/emails/email.helper";
import { TypeEmail } from "../queues/emails/email.job";
import { emailTemplate } from "../queues/emails/template";
import { formater } from "../utils/formater.utils";

export class JobApplicationsService {
    static async create(workerId: string, jobId: string, req: createJobApplicationsRequest): Promise<jobApplicationResponse> {
        const validation = Validation.validate(JobApplicationsValidation.CREATE_SCHEMA, req)
        
        const job = await prismaClient.job.findUnique({
            where: {
                id: jobId
            },
            include: {
                jobProvider: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true
                    }
                }
            }
        })
        if (!job) {
            throw new ResponseError(
                404, 
                "Job not found"
            )
        }
        if (job.status === 'CLOSED') {
            throw new ResponseError(
                400, 
                "Cannot apply, job is permanently closed"
            )
        }
        if (job.status === 'CANCELED' || job.status === 'IN_PROGRESS') {
            throw new ResponseError(
                400, 
                "Job is not open yet, please wait until provider opens it again"
            )
        }
        if (job.jobProviderId === workerId) {
            throw new ResponseError(
                403,
                "Cannot apply to your own job"
            )
        }

        const existingApplication = await prismaClient.jobApplication.findUnique({
            where: {
                workerId_jobId: {
                    workerId: workerId,
                    jobId: jobId
                }
            },
            select: {
                id: true
            }
        })
        if (existingApplication) {
            throw new ResponseError(
                409, 
                "You have already applied to this job"
            )
        }

        let createdJobApplicationId: string
        let workerUsername: string

        const result = await prismaClient.$transaction(async (tx) => {
            const jobApplication = await tx.jobApplication.create({
                data: {
                    workerId: workerId,
                    jobId: jobId,
                    coverLetter: validation.coverLetter ?? null,
                    status: 'APPLIED'
                },
                select: {
                    id: true,
                    status: true,
                    coverLetter: true,
                    appliedAt: true
                }
            })

            const newJob = await tx.job.update({
                where: {
                    id: jobId
                },
                data: {
                    applicationCount: { increment: 1 }
                },
                select: {
                    id: true,
                    applicationCount: true
                }
            })

            const worker = await tx.user.findUnique({
                where: {
                    id: workerId
                },
                select: {
                    username: true,
                    status: true
                }
            })
            if (!worker) {
                throw new ResponseError(
                    404,
                    "Worker not found"
                )
            }
            // if (worker.status === 'PENDING_VERIFICATION') {
            //     throw new ResponseError(
            //         4,
            //         "Please complete your account verification first"
            //     )
            // }

            createdJobApplicationId = jobApplication.id
            workerUsername = worker.username

            return toJobApplicationsResponse(jobApplication, newJob)
        })

        await enqueueManyNotifications([
            {
                id: `JP-notif-JOB_APPLIED-${randomUUID()}`,
                type: 'JOB_APPLIED',
                title: 'New job application',
                message: `Someone applied to your job: ${job.title}`,
                userId: job.jobProviderId,
                jobApplicationId: createdJobApplicationId!
            },
            {
                id: `W-notif-JOB_APPLIED-${randomUUID()}`,
                type: 'JOB_APPLIED',
                title: 'Status job application',
                message: `${workerUsername!.toUpperCase()}, your application was sent to ${formater.getFullName(job.jobProvider.firstName, job.jobProvider.lastName)}`,
                userId: workerId,
                jobApplicationId: createdJobApplicationId!
            }
        ])

        return result
    }

    static async updateStatus(jobProviderId: string, jobApplicationId: string, req: updateJobApplicationRequest): Promise<updateJobApplicationResponse> {
        const validate = Validation.validate(JobApplicationsValidation.UPDATE_SCHEMA, req)

        const jobApplication = await prismaClient.jobApplication.findUnique({
            where: {
                id: jobApplicationId
            },
            include: {
                job: {
                    select: {
                        id: true,
                        jobProviderId: true,
                        acceptedCount: true,
                        required: true,
                        title: true,
                        status: true
                    },
                    include: {
                        jobProvider: {
                            select: {
                                firstName: true,
                                lastName: true,
                                email: true,
                                phone: true
                            }
                        }
                    }
                },
                worker: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        username: true,
                        email: true
                    }
                }
            }
        })
        if (!jobApplication) {
            throw new ResponseError(
                404,
                "Job application not found"
            )
        }
        if (jobApplication.status === 'REJECTED') {
            throw new ResponseError(
                400,
                "Cannot update job application, application already rejected"
            )
        }
        if (jobApplication.status === 'ACCEPTED') {
            throw new ResponseError(
                400, 
                "Cannot update job application, application already accepted"
            )
        }
        if (jobApplication.job.jobProviderId !== jobProviderId) {
            throw new ResponseError(
                403,
                "Not the owner of job"
            )
        }

        if ((validate.status === 'ACCEPTED') && (jobApplication.job.acceptedCount === jobApplication.job.required)) {
            throw new ResponseError(
                400,
                "Accepted applicant already reached maximum"
            )
        }

        const isLastSlot = jobApplication.job.required - jobApplication.job.acceptedCount === 1
        
        if (!isLastSlot && validate.rejectedGlobalMessage !== undefined) {
            throw new ResponseError(
                400, 
                "Rejected global message not required"
            )
        }

            // ======================== TRANSACTION ========================
            // Hanya operasi DB yang masuk transaction
            // Notifikasi di-enqueue SETELAH transaction sukses
            // ============================================================
        let candidateRejectedApps: { 
            workerId: string, 
            id: string, 
            worker: { 
                id: string
                username: string
                email: string 
            } 
        }[] = []
        
        const newJobApplication  = await prismaClient.$transaction(async (tx) => {
            // ── CASE 1: Last slot + ACCEPTED ──
            if (isLastSlot && validate.status === 'ACCEPTED') {
                const jobUpdate = await tx.job.updateMany({
                    where: {
                        id: jobApplication.job.id,
                        acceptedCount: {
                            lt: jobApplication.job.required
                        }
                    },
                    data: {
                        status: 'CLOSED',
                        acceptedCount: { increment: 1 },
                        isPublic: false
                    }
                })
                if (jobUpdate.count === 0) {
                    throw new ResponseError(
                        400,
                        "Accepted applicant already reached maximum"
                    )
                }

                if (validate.rejectedGlobalMessage === undefined) { 
                    throw new ResponseError(
                        400, 
                        "Rejected global message required"
                    )
                }
                
                candidateRejectedApps = await tx.jobApplication.findMany({
                    where: {
                        jobId: jobApplication.job.id,
                        id: { not: jobApplicationId },
                        status: { notIn: ['ACCEPTED'] }
                    },
                    include: {
                        worker: {
                            select: {
                                id: true,
                                username: true,
                                email: true
                            }
                        }
                    }
                })

                await tx.jobApplication.updateMany({
                    where: {
                        jobId: jobApplication.job.id,
                        id: { not: jobApplicationId },
                        status: { notIn: ['ACCEPTED'] }
                    },
                    data: {
                        status: 'REJECTED',
                        rejectedAt: new Date()
                    }
                }) 
            }

            // ── CASE 2: Bukan last slot + ACCEPTED ──
            if (!isLastSlot && validate.status === 'ACCEPTED') {
                // atomic update condition
                const jobUpdate = await tx.job.updateMany({
                    where: {
                        id: jobApplication.job.id,
                        acceptedCount: {
                            lt: jobApplication.job.required
                        }
                    },
                    data: {
                        acceptedCount: { increment: 1 }
                    }
                })
                if (jobUpdate.count === 0) {
                    throw new ResponseError(
                        400,
                        "Accepted applicant already reached maximum"
                    )
                }
            }

            const newJobApplication = await tx.jobApplication.update({
                where: {
                    id: jobApplicationId
                },
                data: {
                    status: validate.status,
                    acceptedAt: validate.status === 'ACCEPTED' ? new Date() : null,
                    rejectedAt: validate.status === 'REJECTED' ? new Date() : null
                },
                select: {
                    id: true,
                    status: true,
                    acceptedAt: true,
                    rejectedAt: true
                }
            })

            return newJobApplication
        })

            // ======================== ENQUEUE NOTIFICATIONS ========================
        // CASE 1: Last slot accepted → (broadcast reject ke semua kandidat == tidak jadi)
        if (isLastSlot && validate.status === 'ACCEPTED') {
            // await enqueueManyNotifications(
            //     candidateRejectedApps.map(app => ({
            //         id: `W-notif-JOB_REJECTED-${randomUUID()}`,
            //         type: 'JOB_REJECTED',
            //         title: `Application update from ${formater.getFullName(jobApplication.job.jobProvider.firstName, jobApplication.job.jobProvider.lastName)}`,
            //         message: (validate.rejectedGlobalMessage ?? 'default').toLowerCase() === 'default'
            //             ? `${ app.worker.username.toUpperCase() }, your application for ${jobApplication.job.title} has been rejected`
            //             : validate.rejectedGlobalMessage,
            //         userId: app.workerId,
            //         jobApplicationId: app.id
            //     }))
            // )

            await enqueueNotification({
                id: `W-notif-JOB_ACCEPTED-${randomUUID()}`,
                type: 'JOB_ACCEPTED',
                title: `Application update from ${formater.getFullName(jobApplication.job.jobProvider.firstName, jobApplication.job.jobProvider.lastName)}`,
                message: (validate.jobMessage ?? 'default').toLowerCase() === 'default' 
                    ? `${ jobApplication.worker.username.toUpperCase() }, Your application for ${jobApplication.job.title} has been accepted` 
                    : validate.jobMessage,
                userId: jobApplication.workerId,
                jobApplicationId: jobApplication.id
            })

            // await enqueueManyEmails(
            //     candidateRejectedApps.map(app => ({
            //         id: app.worker.id,
            //         to: app.worker.email,
            //         subject: `${app.worker.username.toUpperCase()}, Informasi terbaru untuk lamaran anda dari "${formater.getFullName(jobApplication.job.jobProvider.firstName, jobApplication.job.jobProvider.lastName)}"`,
            //         html: emailTemplate.jobRejected(
            //             app.worker.username.toUpperCase(), 
            //             jobApplication.job.title, 
            //             formater.getFullName(jobApplication.job.jobProvider.firstName, jobApplication.job.jobProvider.lastName)
            //         ),
            //         type: TypeEmail.JOB_REJECTED
            //     })),
            // )

            await enqueueEmail(
                {
                    id: jobApplication.id,
                    to: jobApplication.worker.email,
                    subject: `${formater.getFullName(jobApplication.worker.firstName, jobApplication.worker.lastName).toUpperCase()}, Informasi terbaru untuk lamaran anda dari "${formater.getFullName(jobApplication.job.jobProvider.firstName, jobApplication.job.jobProvider.lastName)}"`,
                    html: emailTemplate.jobAccepted(
                        jobApplication.worker.username.toUpperCase(), 
                        jobApplication.job.title, 
                        formater.getFullName(jobApplication.job.jobProvider.firstName, jobApplication.job.jobProvider.lastName),
                        jobApplication.job.jobProvider.email,
                        jobApplication.job.jobProvider.phone!
                    ),
                    type: TypeEmail.JOB_ACCEPTED
                }
            )
        }

        if (validate.status === 'REJECTED') {
            await enqueueNotification({
                id: `W-notif-JOB_REJECTED-${randomUUID()}`,
                type: 'JOB_REJECTED',
                title: `Application update from "${formater.getFullName(jobApplication.job.jobProvider.firstName, jobApplication.job.jobProvider.lastName)}"`,
                message: (validate.jobMessage ?? 'default').toLowerCase() === 'default' 
                    ? `${ jobApplication.worker.username.toUpperCase() }, Your application for ${jobApplication.job.title} has been rejected` 
                    : validate.jobMessage,
                userId: jobApplication.workerId,
                jobApplicationId: jobApplication.id
            })

            await enqueueEmail(
                {
                    id: jobApplication.id,
                    to: jobApplication.worker.email,
                    subject: `${formater.getFullName(jobApplication.worker.firstName, jobApplication.worker.lastName).toUpperCase()}, Informasi terbaru untuk lamaran anda dari "${formater.getFullName(jobApplication.job.jobProvider.firstName, jobApplication.job.jobProvider.lastName)}"`,
                    html: emailTemplate.jobRejected(
                        jobApplication.worker.username.toUpperCase(), 
                        jobApplication.job.title, 
                        formater.getFullName(jobApplication.job.jobProvider.firstName, jobApplication.job.jobProvider.lastName)
                    ),
                    type: TypeEmail.JOB_REJECTED
                }
            )
        }

        return toUpdateJobApplicationResponse(
            newJobApplication, 
            jobApplication.worker, 
            jobApplication.job
        )
    }

    static async getDetail(userId: string, jobApplicationId: string): Promise<getDetailJobApplicationResponse> {
        const jobApplication = await prismaClient.jobApplication.findUnique({
            where: {
                id: jobApplicationId
            },
            include: {
                job: {
                    select: {
                        id: true,
                        jobProviderId: true,
                        title: true,
                        status: true,
                        jobSite: true,
                        level: true,
                        locations: true
                    },
                    include: {
                        jobProvider: {
                            select: {
                                firstName: true,
                                lastName: true
                            }
                        }
                    }
                },
                worker: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        username: true,
                        profilePictUrl: true,
                        email: true,
                        phone: true
                    }
                }
            }
        })

        if (!jobApplication) {
            throw new ResponseError(
                404,
                "Job application not found"
            )
        }

        const isProvider = userId === jobApplication.job.jobProviderId
        const isWorker = userId === jobApplication.workerId

        if (!isProvider && !isWorker) {
            throw new ResponseError(403, "Forbidden")
        }

        if (isProvider && jobApplication.status === 'APPLIED') {
            const updated = await prismaClient.jobApplication.updateMany({
                where: { 
                    id: jobApplicationId,
                    status: 'APPLIED'
                },
                data: {
                    status: 'REVIEWED',
                    reviewedAt: new Date()
                }
            })

            if (updated.count > 0) {
                await enqueueNotification({
                    id: `W-notif-JOB_REVIEWED-${randomUUID()}`,
                    type: 'JOB_REVIEWED',
                    title: `Application update from ${formater.getFullName(jobApplication.job.jobProvider.firstName, jobApplication.job.jobProvider.lastName)}`,
                    message: `${jobApplication.worker.username.toUpperCase()}, Your application for ${jobApplication.job.title} has been reviewed by owner`,
                    userId: jobApplication.workerId,
                    jobApplicationId: jobApplication.id
                })
            }
        }

        return toGetDetailJobApplicationResponse(
            jobApplication.worker,
            jobApplication.job,
            jobApplication,
            isProvider
        )
    }

    static async getListForJobProvider(jobId: string, query: getListJobApplicationQuery): Promise<Pagable<getListJobApplicationResponse>> {
        const validate = Validation.validate(JobApplicationsValidation.GET_LIST_JOB_PROVIDER_SCHEMA, query)

        const skip = (validate.page - 1) * validate.size
        const filters: Prisma.JobApplicationWhereInput[] = []
        
        if (validate.status) {
            filters.push({
                status: validate.status
            })
        }

        if (validate.name) {
            filters.push({
                worker: {
                    OR: [
                        {
                            firstName: {
                                contains: validate.name,
                                mode: 'insensitive'
                            }
                        },
                        {
                            lastName: {
                                contains: validate.name,
                                mode: 'insensitive'
                            }
                        }
                    ]
                }
            })
        }

        const [jobApps, totalData] = await prismaClient.$transaction([
            prismaClient.jobApplication.findMany({
                where: {
                    jobId: jobId,
                    ...(filters.length && { AND: filters })
                },
                select: {
                    id: true,
                    workerId: true,
                    jobId: true,
                    status: true,
                    appliedAt: true,
                    reviewedAt: true,
                    acceptedAt: true,
                    rejectedAt: true
                },
                orderBy: {
                    appliedAt: 'desc',
                },
                take: validate.size,
                skip: skip
            }),

            prismaClient.jobApplication.count({
                where: {
                    jobId: jobId,
                    ...(filters.length && { AND: filters })
                }
            })
        ])

        const workerIds = jobApps.map(app => app.workerId)
        const workers = await prismaClient.user.findMany({
            where: {
                id: {
                    in: workerIds
                }
            },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                profilePictUrl: true
            }
        })

        const job = await prismaClient.job.findUnique({
            where: {
                id: jobId
            },
            select: {
                id: true,
                title: true,
                createdAt: true
            }
        })

        const totalPage = Math.max(1, Math.ceil(totalData / validate.size))

        const workerMap = new Map(
            workers.map(worker => [worker.id, worker])
        )
        const datas: getListJobApplicationResponse[] = jobApps.map(jobApp => {
            const worker = workerMap.get(jobApp.workerId)
            if (!worker || !job) {
                throw new ResponseError(
                    500,
                    "Data mapping error"
                )
            }

            return toGetListJobApplicationResponse(
                worker,
                job,
                jobApp,
                true
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

    static async getListForWorker(workerId: string, query: getListJobApplicationQuery): Promise<Pagable<getListJobApplicationResponse>> {
        const validate = Validation.validate(JobApplicationsValidation.GET_LIST_WORKER_SCHEMA, query)

        const skip = (validate.page - 1) * validate.size
        const filters: Prisma.JobApplicationWhereInput[] = []

        if (validate.status) {
            filters.push({
                status: validate.status
            })
        }

        if (validate.name) {
            filters.push({
                job: {
                    jobProvider: {
                        OR: [
                            {
                                firstName: {
                                    contains: validate.name,
                                    mode: 'insensitive'
                                }
                            },
                            {
                                lastName: {
                                    contains: validate.name,
                                    mode: 'insensitive'
                                }
                            }
                        ]
                    }
                }
            })
        }

        const [jobApps, totalData] = await prismaClient.$transaction([
            prismaClient.jobApplication.findMany({
                where: {
                    workerId: workerId,
                    ...(filters.length && { AND: filters })
                },
                include: {
                    job: {
                        select: {
                            id: true,
                            title: true,
                            createdAt: true,
                            jobProvider: {
                                select: {
                                    id: true,
                                    firstName: true,
                                    lastName: true,
                                    profilePictUrl: true
                                }
                            }
                        }
                    }
                },
                orderBy: {
                    appliedAt: 'desc',
                },
                take: validate.size,
                skip: skip
            }),

            prismaClient.jobApplication.count({
                where: {
                    workerId: workerId,      
                    ...(filters.length && { AND: filters })
                }
            })
        ])

        const totalPage = Math.max(1, Math.ceil(totalData / validate.size))
        const datas: getListJobApplicationResponse[] = jobApps.map(jobApp => {
            return toGetListJobApplicationResponse(
                jobApp.job.jobProvider,
                jobApp.job,
                jobApp,
                false
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
}