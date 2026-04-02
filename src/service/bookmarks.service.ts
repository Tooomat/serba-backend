import { prismaClient } from "../application/database";
import { ResponseError } from "../error/service-response.error";
import { addBookmarksResponse, listBookmarksQuery, listBookmarksResponse, toListBookmarksResponse } from "../model/bookmarks.model";
import { buildPaging, Pagable } from "../model/paging.model";
import { BookmarksValidation } from "../validation/bookmarks.validation";
import { Validation } from "../validation/validation";

export class BookmarkService { 
    static async add(userId: string, jobId: string): Promise<addBookmarksResponse> {
        const existing = await prismaClient.bookmarks.findUnique({
            where: {
                userId_jobId: {
                    userId,
                    jobId
                }
            },
            select: {
                id: true
            }
        })
        if (existing) {
            throw new ResponseError(409, "Job already bookmarked")
        }

        const bookmark = await prismaClient.bookmarks.create({
            data: {
                userId: userId,
                jobId: jobId
            }
        })

        return {
            id: bookmark.id
        }
    }

    static async list(userId: string, query: listBookmarksQuery): Promise<Pagable<listBookmarksResponse>> {
        const validate = Validation.validate(BookmarksValidation.LIST_SCHEMA, query)

        const skip = (validate.page - 1) * validate.size
        
        const [bookmarks, totalData] = await prismaClient.$transaction([
            prismaClient.bookmarks.findMany({
                where: {
                    userId: userId
                },
                include: {
                    job: {
                        select: {
                            id: true,
                            title: true,
                            budgetMin: true,
                            budgetMax: true,
                            budgetType: true,
                            jobSite: true,
                            type: true,
                            createdAt: true
                        }
                    }
                },
                orderBy: {
                    createdAt: 'desc',
                },
                take: validate.size,
                skip: skip
            }),

            prismaClient.bookmarks.count({
                where: {
                    userId: userId
                }
            })
        ])
        const totalPage = Math.max(1, Math.ceil(totalData / validate.size))
        const datas: listBookmarksResponse[] = bookmarks.map(bookmark => {
            return toListBookmarksResponse(
                bookmark,
                bookmark.job
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

    static async delete(userId: string, bookmarkId: string): Promise<void> {
        const bookmark = await prismaClient.bookmarks.findUnique({
            where: {
                id: bookmarkId,
                userId: userId
            }
        })

        if (!bookmark) {
            throw new ResponseError(404, "Bookmark not found")
        }

        await prismaClient.bookmarks.delete({
            where: {
                id: bookmarkId,
                userId: userId
            }
        })
    }
}