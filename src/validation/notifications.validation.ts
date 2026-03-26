import z from "zod";
import { NotificationType } from "../generated/prisma/enums";

export class NotificationsValications {
    static readonly LIST_SCHEMA = z.object({
        isRead: z
            .coerce
            .boolean()
            .optional(),
        type: z
            .string()
            .toLowerCase()
            .refine((val) => ["job applied", "job rejected", "job reviewed", "job accepted"].includes(val), {
                message: "Type must be one of: Job Applied, Job Rejected, Job Accepted, or Job Reviewed"
            })
            .transform((val): NotificationType => {
                const typeNotifications: Record<"job applied" | "job rejected" | "job reviewed" | "job accepted", NotificationType> = {
                    "job applied": NotificationType.JOB_APPLIED,
                    "job rejected": NotificationType.JOB_REJECTED,
                    "job accepted": NotificationType.JOB_ACCEPTED,
                    "job reviewed": NotificationType.JOB_REVIEWED
                }
                return typeNotifications[val as "job applied" | "job rejected" | "job reviewed" | "job accepted"]
            })
            .optional(),
        page: z
            .coerce
            .number()
            .min(1)
            .positive()
            .default(1),
        size: z
            .coerce
            .number()
            .min(1)
            .max(20)
            .positive()
            .default(10),
    })
}

export type ListNotificationsQuery = z.infer<typeof NotificationsValications.LIST_SCHEMA>