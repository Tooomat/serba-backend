import { validate } from "uuid";
import { prismaClient } from "../application/database";
import { ResponseError } from "../error/service-response.error";
import { TypeReview } from "../generated/prisma/enums";
import { 
    createReviewsRequest, 
    getListReviewQuery, 
    getListReviewsResponse, 
    replyReviewRequest, 
    replyReviewResponse, 
    submitReviewsResponse, 
    toGetListReviewsResponse, 
    toReplyReviewResponse, 
    toSubmitReviewsResponse,
    toUpdateReviewedResponse,
    updateReplyRequest,
    updateReviewedResponse,
    updateReviewRequest
} from "../model/reviews.model";
import { ReviewsValidation } from "../validation/reviews.validation";
import { Validation } from "../validation/validation";
import { buildPaging, Pagable } from "../model/helper/paging.helper";
import { Prisma } from "../generated/prisma/client";

const EDIT_DEADLINE_HOURS = 24

export class ReviewsService {
    static async create(userId: string, jobApplicationId: string, req: createReviewsRequest): Promise<submitReviewsResponse> {
        const validate = Validation.validate(ReviewsValidation.CREATE_SCHEMA, req)

        const jobApp = await prismaClient.jobApplication.findUnique({
            where: {
                id: jobApplicationId
            },
            include: {
                job: {
                    select: {
                        id: true,
                        status: true,
                        title: true,
                        jobProvider: {
                            select: { id: true }
                        }
                    },
                },
                worker: {
                    select: {
                        id: true
                    }
                }
            }
        })

        if (!jobApp) {
            throw new ResponseError(404, "Job application not found")
        }

        const isWorker = jobApp.worker.id === userId
        const isProvider = jobApp.job.jobProvider.id === userId

        if (!isProvider && !isWorker) {
            throw new ResponseError(403, "You are not involved in this job")
        }

        if (jobApp.job.status !== 'CLOSED') {
            throw new ResponseError(400, "Cannot review, job is not closed yet")
        }

        if (jobApp.status !== 'ACCEPTED') {
            throw new ResponseError(400, "Cannot review, job application is not accepted")
        }

        // Cek sudah pernah review
        const existingReview = await prismaClient.reviews.findUnique({
            where: {
                reviewerId_jobApplicationId: {
                    reviewerId: userId,
                    jobApplicationId: jobApplicationId
                }
            }
        })
        if (existingReview) {
            throw new ResponseError(409, "You have already reviewed this job")
        }

        const revieweeId = isWorker ? jobApp.job.jobProvider.id : jobApp.worker.id
        const type: TypeReview = isWorker ? 'WORKER_TO_PROVIDER' : 'PROVIDER_TO_WORKER'

        const review = await prismaClient.reviews.create({
            data: {
                rating: validate.rating,
                comment: validate.comment,
                type: type,
                reviewerId: userId,
                revieweeId: revieweeId,
                jobApplicationId: jobApplicationId
            },
            include: {
                reviewer: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        profilePictUrl: true
                    }
                },
                reviewee: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        profilePictUrl: true
                    }
                }
            }
        })

        return toSubmitReviewsResponse(
            review, 
            review.reviewer, 
            review.reviewee, 
            jobApp.job
        )
    }

    static async reply(userId: string, reviewId: string, req: replyReviewRequest): Promise<replyReviewResponse> {
        const validate = Validation.validate(ReviewsValidation.REPLY_SCHEMA, req)

        const review = await prismaClient.reviews.findUnique({
            where: { 
                id: reviewId 
            },
            include: {
                reviewer: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        profilePictUrl: true
                    }
                }
            }
        })
        if (!review) {
            throw new ResponseError(404, "Review not found")
        }
        if (review.revieweeId !== userId) {
            throw new ResponseError(403, "Only the reviewee can reply")
        }
        if (review.replyComment && review.repliedAt) {
            throw new ResponseError(409, "Review already replied")
        }

        const newReview = await prismaClient.reviews.update({
            where: { id: reviewId },
            data: {
                replyComment: validate.replyComment,
                repliedAt: new Date()
            },
            select: {
                id: true,
                replyComment: true,
                repliedAt: true
            }
        })

        return toReplyReviewResponse(
            newReview, 
            review.reviewer
        )
    }

    static async getList(
        visitUserId: string, // pemilik profil yang dilihat
        query: getListReviewQuery, 
        loggedInUserId?: string // optional, hanya untuk endpoint pribadi
    ): Promise<Pagable<getListReviewsResponse>> {
        const validate = Validation.validate(ReviewsValidation.GET_LIST_SCHEMA, query)

        const skip = (validate.page - 1) * validate.size
        const filters: Prisma.ReviewsWhereInput[] = [
            { 
                revieweeId: visitUserId // userId = id pemilik profil, bukan yang login
            }
        ]

        if (validate.rating) {
            filters.push({ rating: validate.rating })
        }

        if (validate.as === 'worker') {
            filters.push({ type: 'PROVIDER_TO_WORKER' })
        } else if (validate.as === 'provider') {
            filters.push({ type: 'WORKER_TO_PROVIDER' })
        }

        const [reviews, totalData] = await prismaClient.$transaction([
            prismaClient.reviews.findMany({
                where: { AND: filters },

                include: {
                    reviewer: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            profilePictUrl: true
                        }
                    },
                    reviewee: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            profilePictUrl: true
                        }
                    },
                    jobApplication: {
                        select: {
                            job: {
                                select: {
                                    id: true,
                                    title: true
                                }
                            }
                        }
                    }
                },
                orderBy: { createdAt: 'desc' },
                take: validate.size,
                skip
            }),
            prismaClient.reviews.count({
                where: { AND: filters }
            })
        ])

        const totalPage = Math.max(1, Math.ceil(totalData / validate.size))
        const datas: getListReviewsResponse[] = reviews.map(review => {
            return toGetListReviewsResponse(
                review,
                review.reviewer,
                review.reviewee,
                review.jobApplication.job,
                loggedInUserId
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

    static async update(userId: string, reviewId: string, req: updateReviewRequest): Promise<updateReviewedResponse> {
        const validate = Validation.validate(ReviewsValidation.UPDATE_SCHEMA, req)

        const review = await prismaClient.reviews.findUnique({
            where: { 
                id: reviewId 
            },
            select: { 
                id: true, 
                reviewerId: true, 
                createdAt: true 
            }
        })
        if (!review) throw new ResponseError(404, "Review not found")
        
        // hanya reviewer yang bisa update
        if (review.reviewerId !== userId) {
            throw new ResponseError(403, "Not the owner")
        }
        
        const hoursSinceCreated = (Date.now() - review.createdAt.getTime()) / (1000 * 60 * 60)
        if (hoursSinceCreated > EDIT_DEADLINE_HOURS) {
            throw new ResponseError(410, "Edit deadline has passed")
        }

        const reviewData: Record<string, string | number> = {}
        if (validate.comment !== undefined) {
            reviewData.comment = validate.comment
        }
        if (validate.rating !== undefined) {
            reviewData.rating = validate.rating
        }

        const newReview = await prismaClient.reviews.update({
            where: {
                id: reviewId
            },
            data: reviewData,
            select: {
                id: true,
                rating: true,
                comment: true,
                updatedAt: true,
                repliedUpdatedAt: true
            }
        })

        return toUpdateReviewedResponse(
            newReview,
            false
        )
    }

    static async updateReply(userId: string, reviewId: string, req: updateReplyRequest): Promise<updateReviewedResponse> {
        const validate = Validation.validate(ReviewsValidation.UPDATE_REPLY_SCHEMA, req)

        const review = await prismaClient.reviews.findUnique({
            where: { 
                id: reviewId 
            },
            select: { 
                id: true, 
                revieweeId: true, 
                repliedAt: true, 
                replyComment: true 
            }
        })
        if (!review) throw new ResponseError(404, "Review not found")
        
        if (review.revieweeId !== userId) {
            throw new ResponseError(403, "Not the owner of reply")
        }

        // belum pernah reply
        if (!review.replyComment || !review.repliedAt) {
            throw new ResponseError(400, "No reply to update")
        }

        const hoursSinceReplied = (Date.now() - review.repliedAt.getTime()) / (1000 * 60 * 60)
        if (hoursSinceReplied > EDIT_DEADLINE_HOURS) {
            throw new ResponseError(410, "Edit deadline has passed")
        }

        const newReview = await prismaClient.reviews.update({
            where: { 
                id: reviewId 
            },
            data: { 
                replyComment: validate.replyComment
            }
        })

        return toUpdateReviewedResponse(
            newReview,
            true
        )
    }

    static async delete(userId: string, reviewId: string): Promise<void> {
        const review = await prismaClient.reviews.findUnique({
            where: { 
                id: reviewId 
            },
            select: {
                id: true,
                reviewerId: true,
                replyComment: true
            }
        })

        if (!review) throw new ResponseError(404, "Review not found")
        if (review.reviewerId !== userId) throw new ResponseError(403, "Not the owner")
        if (review.replyComment) {
            throw new ResponseError(400, "Cannot delete review that has been replied")
        }

        await prismaClient.reviews.delete({
            where: { 
                id: reviewId
            }
        })
    }

    static async deleteReply(userId: string, reviewId: string): Promise<void> {
        const review = await prismaClient.reviews.findUnique({
            where: { 
                id: reviewId 
            },
            select: {
                id: true,
                revieweeId: true,
                replyComment: true,
                repliedAt: true
            }
        })
        if (!review) throw new ResponseError(404, "Review not found")
        if (review.revieweeId !== userId) throw new ResponseError(403, "Not the owner of reply")

        if (!review.replyComment || !review.repliedAt) {
            throw new ResponseError(400, "No reply to delete")
        }

        await prismaClient.reviews.update({
            where: { 
                id: reviewId 
            },
            data: {
                replyComment: null,
                repliedAt: null
            }
        })
    }
}