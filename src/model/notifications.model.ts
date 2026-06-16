import { Notifications } from "../generated/prisma/client"
import { formater } from "../utils/formater.utils"

export type listNotificationsQuery = {
    isRead?: boolean | undefined
    type?: string | undefined
    page: number
    size: number 
}
export type notificationsResponse = {
    id: string
    type: string
    title: string
    message: string
    isRead: boolean
    jobApplicationId: string
}
export function toNotificationsResponse(
    notif: Pick <Notifications, 'id' | 'type' | 'title' | 'message' | 'isRead' | 'jobApplicationId'>
): notificationsResponse {
    return {
        id: notif.id,
        type: formater.notificationsFormater.type(notif.type),
        title: notif.title,
        message: notif.message,
        isRead: notif.isRead,
        jobApplicationId: notif.jobApplicationId
    }
}

export type updateNotificationResponse = {
    id: string
    isRead: boolean
}
export function toUpdateNotificationResponse(
    notif: Pick <Notifications, 'id' | 'isRead'>
): updateNotificationResponse {
    return {
        id: notif.id,
        isRead: notif.isRead
    }
}