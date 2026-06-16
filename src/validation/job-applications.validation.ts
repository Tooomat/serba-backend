import z from "zod";
import { statusJobApplication } from "../generated/prisma/enums";

export class JobApplicationsValidation {
    static readonly CREATE_SCHEMA = z.object({
        coverLetter: z
            .string()
            .optional()
    })
    static readonly UPDATE_SCHEMA = z.object({
        jobMessage: z
            .string()
            .min(1, "Job message must be at least 1 character")
            .optional(),
        rejectedGlobalMessage: z
            .string()
            .min(1, "Rejected message must be at least 1 character")
            .optional(),
        status: z
            .string("Status is required")
            .toLowerCase()
            .refine((val) => ["accepted", "rejected", "shortlisted"].includes(val), {
                message: "Status must be one of: Accepted, Rejected or Shortlisted"
            })
            .transform((val): statusJobApplication => {
                const statusJobAppMap: Record<"shortlisted" | "accepted" | "rejected", statusJobApplication> = {
                    "shortlisted": statusJobApplication.SHORTLISTED,
                    "accepted": statusJobApplication.ACCEPTED,
                    "rejected": statusJobApplication.REJECTED
                }
                return statusJobAppMap[val as "shortlisted" | "accepted" | "rejected"]
            })
    }).superRefine((data, ctx) => {
        if ((data.status === statusJobApplication.ACCEPTED || data.status === statusJobApplication.REJECTED) && !data.jobMessage) {
            ctx.addIssue({
                code: "custom",
                message: "Job message is required when status is Accepted or Rejected",
                path: ["jobMessage"]
            })
        }
    })

    static readonly GET_LIST_JOB_PROVIDER_SCHEMA = z.object({
        status: z
            .string()
            .toLowerCase()
            .refine((val) => ["applied", "accepted", "rejected", "shortlisted", "reviewed"].includes(val), {
                message: "Status must be one of: Accepted, Rejected, Applied, Reviewed, or Shortlisted"
            })
            .transform((val): statusJobApplication => {
                const statusJobAppMap: Record<"shortlisted" | "accepted" | "rejected" | "applied" | "reviewed", statusJobApplication> = {
                "shortlisted": statusJobApplication.SHORTLISTED,
                "accepted": statusJobApplication.ACCEPTED,
                "rejected": statusJobApplication.REJECTED,
                "applied": statusJobApplication.APPLIED,
                "reviewed": statusJobApplication.REVIEWED
            }
            return statusJobAppMap[val as "shortlisted" | "accepted" | "rejected" | "applied" | "reviewed"]
            })
            .optional(),
        name: z
            .string()
            .optional(),
        page: z
            .coerce
            .number("Page must be a number" )
            .min(1, "Page must be at least 1")
            .positive("Page must be positive")
            .default(1),
        size: z
            .coerce
            .number("Size must be a number" )
            .min(1, "Size must be at least 1")
            .max(20, "Size must be at most 20")
            .positive("Size must be positive")
            .default(10),
    })

    static readonly GET_LIST_WORKER_SCHEMA = z.object({
        status: z
            .string()
            .toLowerCase()
            .refine((val) => ["applied", "accepted", "rejected", "reviewed"].includes(val), {
                message: "Status must be one of: Accepted, Rejected, Applied, or Reviewed"
            })
            .transform((val): statusJobApplication => {
                const statusJobAppMap: Record<"accepted" | "rejected" | "applied" | "reviewed", statusJobApplication> = {
                "accepted": statusJobApplication.ACCEPTED,
                "rejected": statusJobApplication.REJECTED,
                "applied": statusJobApplication.APPLIED,
                "reviewed": statusJobApplication.REVIEWED
            }
            return statusJobAppMap[val as "accepted" | "rejected" | "applied" | "reviewed"]
            })
            .optional(),
        name: z
            .string()
            .optional(),
        page: z
            .coerce
            .number("Page must be a number" )
            .min(1, "Page must be at least 1")
            .positive("Page must be positive")
            .default(1),
        size: z
            .coerce
            .number("Size must be a number" )
            .min(1, "Size must be at least 1")
            .max(20, "Size must be at most 20")
            .positive("Size must be positive")
            .default(10),
    })
}

export type CreateJobApplicationsRequest = z.infer<typeof JobApplicationsValidation.CREATE_SCHEMA>
export type UpdateJobApplicationsRequest = z.infer<typeof JobApplicationsValidation.UPDATE_SCHEMA>
export type GetListJobProviderJobApplicationsRequest = z.infer<typeof JobApplicationsValidation.GET_LIST_JOB_PROVIDER_SCHEMA>
export type GetListWorkerJobApplicationsRequest = z.infer<typeof JobApplicationsValidation.GET_LIST_WORKER_SCHEMA>