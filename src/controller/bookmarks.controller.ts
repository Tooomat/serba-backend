import { Response, NextFunction } from "express";
import { AuthRequest } from "../web/middleware/auth.middleware";
import { BookmarkService } from "../service/bookmarks.service";
import { success_handler, success_handler_without_data } from "../web/http/web-response.http";
import { listBookmarksQuery } from "../model/bookmarks.model";

export class BookmarkController {
    static async add(auth: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { id: userId } = auth.user!
            const jobId: string = String(auth.params.jobId)

            const result = await BookmarkService.add(userId, jobId)
            success_handler(res, "Add bookmark successful", result, 201)
        } catch (e) {
           next(e) 
        }
    }

    static async list(auth: AuthRequest, res: Response, next: NextFunction) {
        try {
            const request: listBookmarksQuery = {
                page: auth.query.page ? Number(auth.query.page) : 1,
                size: auth.query.size ? Number(auth.query.size) : 10
            }
            const { id: userId } = auth.user!

            const results = await BookmarkService.list(userId, request)
            success_handler(res, "Get list bookmarks successful", results, 200)
        } catch (e) {
           next(e) 
        }
    }

    static async delete(auth: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { id: userId } = auth.user!
            const bookmarkId: string = String(auth.params.bookmarkId)

            const result = BookmarkService.delete(userId, bookmarkId)
            success_handler_without_data(res, "Delete bookmark successful", 200)
        } catch (e) {
           next(e) 
        }
    }
}