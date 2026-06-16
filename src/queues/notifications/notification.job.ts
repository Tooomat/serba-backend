import { NotificationType } from "../../generated/prisma/enums"

export type NotificationJobData = {
    id: string
    type: NotificationType
    title: string
    message: string
    userId: string
    jobApplicationId: string
}