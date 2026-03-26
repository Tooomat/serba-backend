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
            .string(),
        rejectedGlobalMessage: z
            .string(),
        status: z
            .string()
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
        if ((data.status === 'ACCEPTED' || data.status === 'REJECTED') && data.jobMessage === undefined) {
            ctx.addIssue({
                code: "custom",
                message: "Status accepted/rejected should add job message",
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

export type CreateJobApplicationsRequest = z.infer<typeof JobApplicationsValidation.CREATE_SCHEMA>
export type UpdateJobApplicationsRequest = z.infer<typeof JobApplicationsValidation.UPDATE_SCHEMA>
export type GetListJobProviderJobApplicationsRequest = z.infer<typeof JobApplicationsValidation.GET_LIST_JOB_PROVIDER_SCHEMA>
export type GetListWorkerJobApplicationsRequest = z.infer<typeof JobApplicationsValidation.GET_LIST_WORKER_SCHEMA>