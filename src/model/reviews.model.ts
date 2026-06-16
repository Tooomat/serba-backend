import { Job, Reviews, User } from "../generated/prisma/client"
import { TypeReview } from "../generated/prisma/enums"
import { formater } from "../utils/formater.utils"
import { timeUtils } from "../utils/time.utils"

// ================================ CREATE ================================
export type createReviewsRequest = {
    comment: string 
    rating: number
}
export type submitReviewsResponse = {
    id: string
    type: TypeReview
    rating: number
    comment?: string | null
    createdAt: Date,
    user: {
        reviewer: {
            id: string
            name: string
            profilePictUrl?: string | null
        }
        reviewee: {
            id: string
            name: string
            profilePictUrl?: string | null
        }
    },
    job: {
        id: string
        title: string
    }
}
export function toSubmitReviewsResponse(
    review: Pick<Reviews, 'id' | 'type' | 'rating' | 'comment' | 'createdAt'>,
    reviewer: Pick<User, 'id' | 'firstName' | 'lastName' | 'profilePictUrl'>,
    reviewee: Pick<User, 'id' | 'firstName' | 'lastName' | 'profilePictUrl'>,
    job: Pick<Job, 'id' | 'title'>
): submitReviewsResponse {
    return {
        id: review.id,
        type: review.type,
        rating: review.rating,
        comment: review.comment,
        createdAt: review.createdAt,
        user: {
            reviewer: {
                id: reviewer.id,
                name: formater.getFullName(reviewer.firstName, reviewer.lastName),
                profilePictUrl: reviewer.profilePictUrl 
            },
            reviewee: {
                id: reviewee.id,
                name: formater.getFullName(reviewee.firstName, reviewee.lastName),
                profilePictUrl: reviewee.profilePictUrl
            }
        },
        job: {
            id: job.id,
            title: job.title
        }
    }
}

// ================================ REPLY ================================
export type replyReviewRequest = {
    ReplyComment: string
}
export type replyReviewResponse = {
    id: string
    replyComment?: string | null
    repliedAt?: Date | null
    reviewer: {
        id: string
        name: string
        profilePictUrl?: string | null
    }
}
export function toReplyReviewResponse(
    review: Pick<Reviews, 'id' | 'replyComment' | 'repliedAt'>,
    reviewer: Pick<User, 'id' | 'firstName' | 'lastName' | 'profilePictUrl'>,
): replyReviewResponse {
    return {
        id: review.id,
        replyComment: review.replyComment,
        repliedAt: review.repliedAt,
        reviewer: {
            id: reviewer.id,
            name: formater.getFullName(reviewer.firstName, reviewer.lastName),
            profilePictUrl: reviewer.profilePictUrl
        }
    }
}

// ================================ GET LIST ================================
export type getListReviewQuery = {
    rating?: number | undefined
    as?: string | undefined
    page: number
    size: number
}
export type getListReviewsResponse = {
    id: string
    rating: number
    type: TypeReview
    review: {
        comment?: string | null
        isMyReview?: boolean | undefined
        by: {
            id: string
            name: string
            profilePictUrl?: string | null
        }
        createdAt?: string | null
        updatedAt?: string | null
    }
    reply?: {
        comment?: string | null
        isMyReply?: boolean | undefined
        by: {
            id: string
            name: string
            profilePictUrl?: string | null
        }
        repliedAt?: string | null
    } | null
    job: {
        id: string
        title: string
    }
}
export function toGetListReviewsResponse(
    review: Pick<Reviews, 'id' | 'rating' | 'type' | 'comment' | 'createdAt' | 'updatedAt' | 'replyComment' | 'repliedAt' | 'reviewerId' | 'revieweeId'>,
    reviewer: Pick<User, 'id' | 'firstName' | 'lastName' | 'profilePictUrl'>,
    reviewee: Pick<User, 'id' | 'firstName' | 'lastName' | 'profilePictUrl'>,
    job: Pick<Job, 'id' | 'title'>,
    loggedInUserId?: string
): getListReviewsResponse {
    const commentAge = timeUtils.getTimeAgo(review.createdAt, 'id')
    const commentUpdate = timeUtils.getTimeAgo(review.updatedAt, 'id')
    const replyCommentAge = timeUtils.getTimeAgo(review.repliedAt, 'id')

    const response: getListReviewsResponse = {
        id: review.id,
        rating: review.rating,
        type: review.type,
        job: {
            id: job.id,
            title: job.title
        },
        review: {
            comment: review.comment,
            isMyReview: loggedInUserId ? review.reviewerId === loggedInUserId : undefined,
            by: {
                id: reviewer.id,
                name: formater.getFullName(reviewer.firstName, reviewer.lastName),
                profilePictUrl: reviewer.profilePictUrl
            },
            createdAt: commentAge,
            updatedAt: commentUpdate
        }
    }

    if (review.replyComment === null && review.repliedAt === null) {
        response.reply = null
    } else if (review.replyComment !== null && review.repliedAt !== null) {
        response.reply = {
            comment: review.replyComment,
            isMyReply: loggedInUserId ? review.revieweeId === loggedInUserId : undefined,
            by: {
                id: reviewee.id,
                name: formater.getFullName(reviewee.firstName, reviewee.lastName),
                profilePictUrl: reviewee.profilePictUrl
            },
            repliedAt: replyCommentAge
        }
    }

    return response
}

// ================================ UPDATE ================================
export type updateReviewRequest = {
    comment?: string | undefined
    rating?: number | undefined
}
export type updateReplyRequest = {
    replyComment: string
}
export type updateReviewedResponse = {
    id: string
    rating: number
    comment?: string | null
    updatedAt?: Date | undefined
    repliedUpdatedAt?: Date | undefined
}
export function toUpdateReviewedResponse(
    review: Pick<Reviews, 'id' | 'rating' | 'comment' | 'updatedAt' | 'repliedUpdatedAt'>,
    isReply: boolean
): updateReviewedResponse {
    const response: updateReviewedResponse = {
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        updatedAt: isReply ? undefined : review.updatedAt ?? undefined,
        repliedUpdatedAt: isReply ? review.repliedUpdatedAt ?? undefined : undefined
    }

    return response
}
