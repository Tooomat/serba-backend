import { prismaClient } from "../../application/database";
import { TypeReview } from "../../generated/prisma/enums";
import { 
    providerStats,
    reviewDistribution, 
    workerStats 
} from "../../model/users.model";
import { formater } from "../../utils/formater.utils";

async function getReviewDistribution(userId: string, type: TypeReview): Promise<reviewDistribution> {
    const rows = await prismaClient.reviews.groupBy({
        by: ['rating'],
        where: { 
            revieweeId: userId, 
            type: type 
        },                  
        _count: { 
            rating: true 
        }
    })

    const dist: reviewDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0, 0: 0 }
    for (const row of rows) {
        const key = row.rating as keyof reviewDistribution
        if (key in dist) dist[key] = row._count.rating
    }
    return dist
}

export async function getWorkerStats(userId: string): Promise<workerStats> {
    const [totalApplied, totalAccepted, totalRejected, reviewsData, latestReviews, distribution] = await Promise.all([
        prismaClient.jobApplication.count({ 
            where: { 
                workerId: userId 
            } 
        }),
        prismaClient.jobApplication.count({ 
            where: { 
                workerId: userId, 
                status: 'ACCEPTED' 
            } 
        }),
        prismaClient.jobApplication.count({
            where: { 
                workerId: userId, 
                status: 'REJECTED' 
            } 
        }),

        // Agregasi rating
        prismaClient.reviews.aggregate({
            where: { 
                revieweeId: userId, 
                type: 'PROVIDER_TO_WORKER' 
            },
            _avg: { 
                rating: true 
            },
            _count: { 
                rating: true 
            }
        }),

        // Distribusi + latest 5 review
        prismaClient.reviews.findMany({
            where: { 
                revieweeId: userId, 
                type: 'PROVIDER_TO_WORKER' 
            },
            orderBy: { 
                createdAt: 'desc' 
            },
            take: 5,
            select: {
                id: true,
                rating: true,
                type: true,
                comment: true,
                createdAt: true,
                updatedAt: true,
                reviewer: {
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
            }
        }),

        getReviewDistribution(userId, 'WORKER_TO_PROVIDER')
    ])

    return {
        totalApplied: totalApplied,
        totalAccepted: totalAccepted,
        totalRejected: totalRejected,
        reviews: {
            averageRating: reviewsData._avg.rating ?? 0,
            totalReviews: reviewsData._count.rating,
            distribution: distribution,
            latest: latestReviews.map(r => ({
                id: r.id,
                rating: r.rating,
                type: r.type,
                review: {
                    comment: r.comment,
                    by: {
                        id: r.reviewer.id,
                        name: formater.getFullName(r.reviewer.firstName, r.reviewer.lastName),
                        profilePictUrl: r.reviewer.profilePictUrl
                    },
                    createdAt: r.createdAt,
                    updatedAt: r.updatedAt
                },
                job: {
                    id: r.jobApplication.job.id,
                    title: r.jobApplication.job.title
                }
            }))
        }
    }
}

export async function getProviderStats(userId: string): Promise<providerStats> {
    const [totalJobsPosted, totalJobsCompleted, totalJobsCanceled, reviewsData, latestReviews, distribution] = await Promise.all([
        prismaClient.job.count({ 
            where: { 
                jobProviderId: userId 
            }                    
        }),

        prismaClient.job.count({ 
            where: { 
                jobProviderId: userId, 
                status: 'CLOSED' 
            }
        }),

        prismaClient.job.count({ 
            where: { 
                jobProviderId: userId, 
                status: 'CANCELED' 
            }
        }),

        prismaClient.reviews.aggregate({
            where: { 
                revieweeId: userId, 
                type: 'WORKER_TO_PROVIDER' 
            },
            _avg: { 
                rating: true 
            },
            _count: { 
                rating: true 
            }
        }),

        prismaClient.reviews.findMany({
            where: { 
                revieweeId: userId, 
                type: 'WORKER_TO_PROVIDER' 
            },
            orderBy: { 
                createdAt: 'desc' 
            },
            take: 5,
            select: {
                id: true,
                rating: true,
                type: true,
                comment: true,
                createdAt: true,
                updatedAt: true,
                reviewer: {
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
            }
        }),

        getReviewDistribution(userId, 'WORKER_TO_PROVIDER')
    ])

    return {
        totalJobsPosted: totalJobsPosted,
        totalJobsCompleted: totalJobsCompleted,
        totalJobsCanceled: totalJobsCanceled,
        reviews: {
            averageRating: reviewsData._avg.rating ?? 0,
            totalReviews: reviewsData._count.rating,
            distribution: distribution,
            latest: latestReviews.map(r => ({
                id: r.id,
                rating: r.rating,
                type: r.type,
                review: {
                    comment: r.comment,
                    by: {
                        id: r.reviewer.id,
                        name: formater.getFullName(r.reviewer.firstName, r.reviewer.lastName),
                        profilePictUrl: r.reviewer.profilePictUrl
                    },
                    createdAt: r.createdAt,
                    updatedAt: r.updatedAt
                },
                job: {
                    id: r.jobApplication.job.id,
                    title: r.jobApplication.job.title
                }
            }))
        }
    }
}