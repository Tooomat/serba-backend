import { Response, NextFunction } from "express";
import { AuthRequest } from "../web/middleware/auth.middleware";
import { 
    createReviewsRequest, 
    getListReviewQuery, 
    replyReviewRequest, 
    updateReplyRequest, 
    updateReviewRequest 
} from "../model/reviews.model";
import { ReviewsService } from "../service/reviews.service";
import { success_handler, success_handler_without_data } from "../web/http/web-response.http";

export class ReviewsController {
    static async create(auth: AuthRequest, res: Response, next: NextFunction) {
        try {
            const request: createReviewsRequest = auth.body as createReviewsRequest
            const jobApplicationId: string = String(auth.params.jobApplicationId)
            const { id: userId } = auth.user!

            const result = await ReviewsService.create(userId, jobApplicationId, request)
            success_handler(res, "Review submitted successfully", result, 201)
        } catch (e) {
            next(e)
        }
    }

    static async reply(auth: AuthRequest, res: Response, next: NextFunction) {
        try {
            const request: replyReviewRequest = auth.body as replyReviewRequest
            const reviewId: string = String(auth.params.reviewId)
            const { id: userId } = auth.user!

            const result = await ReviewsService.reply(userId, reviewId, request)
            success_handler(res, "Reply review successfully", result, 201)
        } catch (e) {
            next(e)
        }
    }

    static async getListSelf(auth: AuthRequest, res: Response, next: NextFunction) {
        try {
            const loggedInUserId = auth.user!.id
            const query: getListReviewQuery = {
                rating: auth.query.rating ? Number(auth.query.rating) : undefined,
                as: auth.query.as ? String(auth.query.as) : undefined,
                page: auth.query.page ? Number(auth.query.page) : 1,
                size: auth.query.size ? Number(auth.query.size) : 10
            }

            const results = await ReviewsService.getList(
                loggedInUserId,  
                query,
                loggedInUserId 
            )
            success_handler(res, "Get list reviews successfully", results, 200)
        } catch (e) {
            next(e)
        }
    }

    static async getListVisitor(auth: AuthRequest, res: Response, next: NextFunction) {
        try {
            const profileUserId: string = String(auth.params.userId)
            const query: getListReviewQuery = {
                rating: auth.query.rating ? Number(auth.query.rating) : undefined,
                as: auth.query.as ? String(auth.query.as) : undefined,
                page: auth.query.page ? Number(auth.query.page) : 1,
                size: auth.query.size ? Number(auth.query.size) : 10
            }
            const results = await ReviewsService.getList(
                profileUserId, 
                query
            )
            success_handler(res, "Get list reviews successfully", results, 200)
        } catch (e) {
            next(e)
        }
    }

    static async update(auth: AuthRequest, res: Response, next: NextFunction) {
        try {
            const request: updateReviewRequest = auth.body as updateReviewRequest
            const reviewId: string = String(auth.params.reviewId)
            const { id: userId } = auth.user!

            const result = await ReviewsService.update(userId, reviewId, request)
            success_handler(res, "Update reviews successfully", result, 200)
        } catch (e) {
            next(e)
        }
    }

    static async updateReply(auth: AuthRequest, res: Response, next: NextFunction) {
        try {
            const request: updateReplyRequest = auth.body as updateReplyRequest
            const reviewId: string = String(auth.params.reviewId)
            const { id: userId } = auth.user!

            const result = await ReviewsService.updateReply(userId, reviewId, request)
            success_handler(res, "Update reply reviews successfully", result, 200)
        } catch (e) {
            next(e)
        }
    }

    static async delete(auth: AuthRequest, res: Response, next: NextFunction) {
        try {
            const reviewId: string = String(auth.params.reviewId)
            const { id: userId } = auth.user!

            await ReviewsService.delete(userId, reviewId)
            success_handler_without_data(res, "Delete reviews successfully", 200)
        } catch (e) {
            next(e)
        }
    }
    
    static async deleteReply(auth: AuthRequest, res: Response, next: NextFunction) {
        try {
            const reviewId: string = String(auth.params.reviewId)
            const { id: userId } = auth.user!

            await ReviewsService.deleteReply(userId, reviewId)
            success_handler_without_data(res, "Delete reply reviews successfully", 200)
        } catch (e) {
            next(e)
        }
    }
}