import { Response, NextFunction } from "express";
import { AuthRequest } from "../web/middleware/auth.middleware";
import { listNotificationsQuery } from "../model/notifications.model";
import { NotificationService } from "../service/notifications.service";
import { success_handler, success_handler_without_data } from "../web/http/web-response.http";

export class NotificationsController {
    static async list(auth: AuthRequest, res: Response, next: NextFunction) {
        try {
            const request: listNotificationsQuery = {
                isRead: auth.query.isRead 
                    ? auth.query.isRead === "true" 
                    : undefined,
                type: auth.query.type ? String(auth.query.type) : undefined,
                page: auth.query.page ? Number(auth.query.page) : 1,
                size: auth.query.size ? Number(auth.query.size) : 10
            }
            const { id: userId } = auth.user!
            const results = await NotificationService.list(userId, request)
            success_handler(res, "Get list notifications successfully", results, 200)
        } catch (e) {
            next(e)
        }
    }

    static async update(auth: AuthRequest, res: Response, next: NextFunction) {
        try {
            const notificationId: string = String(auth.params.notificationId)
            const { id: userId } = auth.user!
            const result = await NotificationService.update(userId, notificationId)
            success_handler(res, "Update notification successfully", result, 200)
        } catch (e) {
            next(e)
        }
    }

    static async markAllAsRead(auth: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { id: userId } = auth.user!
            const result = await NotificationService.markAllAsRead(userId)
            success_handler(res, "All notifications marked as read", result, 200)
        } catch (e) {
            next(e)
        }
    }

    static async delete(auth: AuthRequest, res: Response, next: NextFunction) {
        try {
            const notificationId: string = String(auth.params.notificationId)
            const { id: userId } = auth.user!
            await NotificationService.delete(userId, notificationId)
            success_handler_without_data(res, "Delete notification successfully", 200)
        } catch (e) {
            next(e)
        }
    }
}