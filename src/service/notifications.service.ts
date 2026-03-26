import { prismaClient } from "../application/database";
import { ResponseError } from "../error/service-response.error";
import { Prisma } from "../generated/prisma/client";
import { buildPaging, Pagable } from "../model/helper/paging.helper";
import { 
    listNotificationsQuery, 
    notificationsResponse, 
    toNotificationsResponse,
    toUpdateNotificationResponse,
    updateNotificationResponse
} from "../model/notifications.model";
import { NotificationsValications } from "../validation/notifications.validation";
import { Validation } from "../validation/validation";

export class NotificationService {
    static async list(userId: string, query: listNotificationsQuery): Promise<Pagable<notificationsResponse>> {
        const validate = Validation.validate(NotificationsValications.LIST_SCHEMA, query)

        const skip = (validate.page - 1) * validate.size
        const filters: Prisma.NotificationsWhereInput[] = []

        if (validate.isRead !== undefined) {
            filters.push({
                isRead: validate.isRead
            })
        }

        if (validate.type) {
            filters.push({
                type: validate.type
            })
        }

        const [notifications, totalData, unreadData] = await prismaClient.$transaction([
            prismaClient.notifications.findMany({
                where: {
                    userId: userId,
                    ...(filters.length && { AND: filters })
                },
                select: {
                    id: true,
                    type: true,
                    title: true,
                    message: true,
                    isRead: true,
                    jobApplicationId: true
                },
                orderBy: {
                    createdAt: 'desc'
                },
                take: validate.size,
                skip: skip
            }),

            prismaClient.notifications.count({
                where: {
                    userId: userId,
                    ...(filters.length && { AND: filters })
                }
            }),

            prismaClient.notifications.count({
                where: { 
                    userId: userId, 
                    isRead: false 
                }
            })
        ])

        const totalPage = Math.max(1, Math.ceil(totalData / validate.size))

        const datas: notificationsResponse[] = notifications.map(notif => {
            return toNotificationsResponse(notif)
        })

        return {
            data: datas,
            unread: unreadData,
            paging: buildPaging(
                validate.page,
                validate.size,
                totalData,
                totalPage
            )
        }
    }

    static async update(userId: string, notificationId: string): Promise<updateNotificationResponse> {
        
        const notif = await prismaClient.notifications.findUnique({
            where: {
                id: notificationId,
                userId: userId
            },
            select: {
                id:true,
                isRead: true
            }
        })

        if (!notif) {
            throw new ResponseError(
                404,
                "Notification not found"
            )
        }

        const newNotif = await prismaClient.notifications.update({
            where: {
                id: notificationId,
                userId: userId
            },
            data: {
                isRead: true
            },
            select: {
                isRead: true,
                id: true
            }
        })

        return toUpdateNotificationResponse(
            newNotif
        )
    
    }

    static async markAllAsRead(userId: string): Promise<{ count: number }> {
        const result = await prismaClient.notifications.updateMany({
            where: { 
                userId: userId, 
                isRead: false 
            },
            data: { 
                isRead: true 
            }
        })

        return { 
            count: result.count 
        }
    }

    static async delete(userId: string, notificationId: string): Promise<void> {
        const notif = await prismaClient.notifications.findUnique({
            where: {
                id: notificationId,
                userId: userId
            },
            select: {
                id: true
            }
        })
        if (!notif) {
            throw new ResponseError(
                404,
                "Notification not found"
            )
        }

        await prismaClient.notifications.delete({
            where: {
                id: notificationId,
                userId: userId
            }
        })
    }
}