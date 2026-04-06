import z from "zod";
import { BudgetTypeJob, JobSite, LevelJob, StatusJob, TypeJob } from "../generated/prisma/enums";

export class JobsValidation {
    static readonly CREATE_SCHEMA = z.object({
        addressId: z
            .string(),
        jobCategoriesId: z
            .array(
                z
                .string()
                .min(3, { message: "Category ID cannot be empty" })
            )
            .min(1, { message: "Minimum 1 category must be selected" })
            .max(2, { message: "Maximum 2 job categories allowed" })
            .refine(
                (val) => new Set(val).size === val.length,
                { message: "Duplicate categories are not allowed" }
            ),
        title: z
            .string()
            .min(3),
        introduction: z
            .string()
            .min(3)
            .optional(),
        description: z
            .string()
            .min(5),
        level: z
            .array(
                z
                .string()
                .toLowerCase()
                .refine((val) => {
                    const validLevels = ["beginner", "intermediate", "advanced", "expert"]
                    return validLevels.includes(val)
                }, {
                    message: "Level must be one of: Beginner, Intermediate, Advanced, Expert"
                })
                .transform((val): LevelJob => {
                    const levelMap: Record<string, LevelJob> = {
                        "beginner": LevelJob.BEGINNER,  
                        "intermediate": LevelJob.INTERMEDIATE,
                        "advanced": LevelJob.ADVANCED,
                        "expert": LevelJob.EXPERT
                    }
                    return levelMap[val]!
                })
            )
            .min(1, { message: "Minimum 1 level must be selected" }),
        
        type: z 
            .string() 
            .toLowerCase() 
            .refine((val) => ["urgent", "non urgent"].includes(val), 
                { message: "type as must be either Urgent or Non urgent" }
            )
            .transform((val) =>
                val === "urgent" ? TypeJob.URGENT : TypeJob.NON_URGENT
            ),
        required: z
            .number()
            .min(1),
        jobSite: z 
            .string() 
            .toLowerCase() 
            .refine((val) => ["on site", "hybrid", "remote"].includes(val), 
                { message: "job site as must be either on Site, Hybrid or Remote" }
            )
            .transform((val) => {
                if (val === "on site") return JobSite.ON_SITE
                if (val === "hybrid") return JobSite.HYBRID
                return JobSite.REMOTE
            }),
        budgetMin: z
            .number()
            .min(1)
            .optional(),
        budgetMax: z
            .number()
            .min(1)
            .optional(),
        budgetType: z 
            .string() 
            .toLowerCase() 
            .refine((val) => ["fixed", "hourly", "negotiable"].includes(val), 
                { message: "budget type as must be either Fixed, Hourly or Negotiable" }
            ) 
            .transform((val) => {
                if (val === "fixed") return BudgetTypeJob.FIXED
                if (val === "hourly") return BudgetTypeJob.HOURLY
                return BudgetTypeJob.NEGOTIABLE
            })
            .optional(),
        status: z 
            .string() 
            .toLowerCase() 
            .refine((val) => ["open", "canceled", "in progress", "closed"].includes(val), 
                { message: "status type as must be either Open, Canceled, In progress, or Closed" }
            )
            .transform((val) => {
                if (val === 'open') return StatusJob.OPEN 
                if (val === 'in progress') return StatusJob.IN_PROGRESS 
                if (val === 'canceled') return StatusJob.CANCELED
                return StatusJob.CLOSED
            }),
        startTime: z
            .string()
            .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Format must be HH:mm")
            .optional(),
        endTime: z
            .string()
            .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Format must be HH:mm")
            .optional(),
        startDate: z
            .string()
            .regex(/^\d{4}-\d{2}-\d{2}$/, "Format must be YYYY-MM-DD")
            .refine((dateStr) => {
                const date = new Date(dateStr)

                if (isNaN(date.getTime())) return false

                // Format kembali ke YYYY-MM-DD
                const formatted =
                    date.getFullYear().toString().padStart(4, "0") +
                    "-" +
                    (date.getMonth() + 1).toString().padStart(2, "0") +
                    "-" +
                    date.getDate().toString().padStart(2, "0")

                return formatted === dateStr
            }, "Invalid date")
            .transform((str) => new Date(str))
            .optional(),

        endDate: z
            .string()
            .regex(/^\d{4}-\d{2}-\d{2}$/, "Format must be YYYY-MM-DD")
            .refine((dateStr) => {
                const date = new Date(dateStr)

                if (isNaN(date.getTime())) return false

                // Format kembali ke YYYY-MM-DD
                const formatted =
                    date.getFullYear().toString().padStart(4, "0") +
                    "-" +
                    (date.getMonth() + 1).toString().padStart(2, "0") +
                    "-" +
                    date.getDate().toString().padStart(2, "0")

                return formatted === dateStr
            }, "Invalid date")
            .transform((str) => new Date(str))
            .optional(),

    }).superRefine((data, ctx) => {

        // ===== TIME VALIDATION =====
        if (data.startTime && data.endTime) {
            const [sh=0, sm=0] = data.startTime.split(":").map(Number)
            const [eh=0, em=0] = data.endTime.split(":").map(Number)

            const start = sh * 60 + sm
            const end = eh * 60 + em

            if (end <= start) {
                ctx.addIssue({
                    code: "custom",
                    message: "endTime must be greater than startTime",
                    path: ["endTime"]
                })
            }
        }
        if (data.endTime && !data.startTime) {
            ctx.addIssue({
                code: "custom",
                message: "startTime must be provided if endTime is filled",
                path: ["startTime"]
            })
        }

        // ===== DATE VALIDATION =====
        if (data.startDate) {
            const inputDate = new Date(data.startDate)
            const today = new Date()
            today.setHours(0,0,0,0)
            inputDate.setHours(0,0,0,0)

            if (inputDate < today) {
                ctx.addIssue({
                    code: "custom",
                    message: "startDate cannot be less than today",
                    path: ["startDate"]
                })
            }
        }
        if (data.startDate && data.endDate) {
            const start = new Date(data.startDate)
            const end = new Date(data.endDate)

            if (end < start) {
                ctx.addIssue({
                    code: "custom",
                    message: "endDate must be greater than startDate",
                    path: ["endDate"]
                })
            }
        }
        if (data.endDate && !data.startDate) {
            ctx.addIssue({
                code: "custom",
                message: "startDate must be provided if endDate is filled",
                path: ["startDate"]
            })
        }

        // ===== BUDGET VALIDATION =====
        if (data.budgetMin && data.budgetMax) {
            if (data.budgetMax < data.budgetMin) {
                ctx.addIssue({
                    code: "custom",
                    message: "budgetMax must be greater than budgetMin",
                    path: ["budgetMax"]
                })
            }
        }
        if ((data.budgetMin || data.budgetMax) && !data.budgetType) {
            ctx.addIssue({
                code: "custom",
                message: "budgetType required when budget is provided",
                path: ["budgetType"]
            })
        }
        // if (data.budgetMax && !data.budgetMin) {
        //     ctx.addIssue({
        //         code: "custom",
        //         message: "budgetMin must be provided if budgetMax is filled",
        //         path: ["budgetMin"]
        //     })
        // }
        if (data.budgetType && !data.budgetMin && !data.budgetMax) {
            ctx.addIssue({
                code: "custom",
                message: "budgetType cannot be filled without budgetMin or budgetMax",
                path: ["budgetType"]
            })
        }
    }) 

    static readonly LIST_JOB_SCHEMA = z.object({
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

    static readonly SEARCH_JOB_SCHEMA = z.object({
        jobCategoriesId: z
            .array(
                z
                .string()
                .min(3, { message: "Category ID cannot be empty" })
            )
            .min(1, { message: "Minimum 1 category must be selected" })
            .max(2, { message: "Maximum 2 job categories id allowed" })
            .refine(
                (val) => new Set(val).size === val.length,
                { message: "Duplicate categories are not allowed" }
            )
            .optional(),
        title: z   
            .string()
            .optional(),
        level: z
            .array(
                z
                .string()
                .toLowerCase()
                .refine((val) => {
                    const validLevels = ["beginner", "intermediate", "advanced", "expert"]
                    return validLevels.includes(val)
                }, {
                    message: "Level must be one of: Beginner, Intermediate, Advanced, Expert"
                })
                .transform((val) => {
                    const levelMap: Record<string, LevelJob> = {
                        "beginner": LevelJob.BEGINNER,  
                        "intermediate": LevelJob.INTERMEDIATE,
                        "advanced": LevelJob.ADVANCED,
                        "expert": LevelJob.EXPERT
                    }
                    return levelMap[val]
                })
            )
            .min(1, { message: "Minimum 1 level must be selected" })
            .optional(),
        status: z 
            .string() 
            .toLowerCase() 
            .refine((val) => ["open", "canceled", "in progress", "closed"].includes(val), 
                { message: "status type as must be either Open, Canceled, In progress, or Closed" }
            )
            .transform((val) => {
                if (val === 'open') return StatusJob.OPEN 
                if (val === 'in progress') return StatusJob.IN_PROGRESS 
                if (val === 'canceled') return StatusJob.CANCELED
                return StatusJob.CLOSED
            })
            .optional(),
        provinceId: z
            .string()
            .optional(),
        cityId: z
            .string()
            .optional(),
        districtId: z
            .string()
            .optional(),
        subdistrictId: z
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

    static readonly UPDATE_SCHEMA = z.object({
        addressId: z
            .uuid()
            .optional(),
        jobCategoriesId: z
            .array(
                z
                .string()
                .min(3, { message: "Category ID cannot be empty" })
            )
            .min(1, { message: "Minimum 1 category must be selected" })
            .max(2, { message: "Maximum 2 job categories allowed" })
            .refine(
                (val) => new Set(val).size === val.length,
                { message: "Duplicate categories are not allowed" }
            )
            .optional(),
        title: z
            .string()
            .min(3)
            .optional(),
        introduction: z
            .string()
            .min(3)
            .optional(),
        description: z
            .string()
            .min(5)
            .optional(),
        level: z
            .array(
                z
                .string()
                .toLowerCase()
                .refine((val) => {
                    const validLevels = ["beginner", "intermediate", "advanced", "expert"]
                    return validLevels.includes(val)
                }, {
                    message: "Level must be one of: Beginner, Intermediate, Advanced, Expert"
                })
                .transform((val): LevelJob => {
                    const levelMap: Record<string, LevelJob> = {
                        "beginner": LevelJob.BEGINNER,  
                        "intermediate": LevelJob.INTERMEDIATE,
                        "advanced": LevelJob.ADVANCED,
                        "expert": LevelJob.EXPERT
                    }
                    return levelMap[val]!
                })
            )
            .min(1, { message: "Minimum 1 level must be selected" })
            .max(4)
            .optional(),
        
        type: z 
            .string() 
            .toLowerCase() 
            .refine((val) => ["urgent", "non urgent"].includes(val), 
                { message: "type as must be either Urgent or Non urgent" }
            )
            .transform((val) =>
                val === "urgent" ? TypeJob.URGENT : TypeJob.NON_URGENT
            )
            .optional(),
        required: z
            .number()
            .min(1)
            .optional(),
        jobSite: z 
            .string() 
            .toLowerCase() 
            .refine((val) => ["on site", "hybrid", "remote"].includes(val), 
                { message: "job site as must be either On site, Hybrid or Remote" }
            )
            .transform((val) => {
                if (val === "on site") return JobSite.ON_SITE
                if (val === "hybrid") return JobSite.HYBRID
                return JobSite.REMOTE
            })
            .optional(),
        budgetMin: z
            .number()
            .min(1)
            .optional(),
        budgetMax: z
            .number()
            .min(1)
            .optional(),
        budgetType: z 
            .string() 
            .toLowerCase() 
            .refine((val) => ["fixed", "hourly", "negotiable"].includes(val), 
                { message: "budget type as must be either Fixed, Hourly or Negotiable" }
            ) 
            .transform((val) => {
                if (val === "fixed") return BudgetTypeJob.FIXED
                if (val === "hourly") return BudgetTypeJob.HOURLY
                return BudgetTypeJob.NEGOTIABLE
            })
            .optional(),
        status: z 
            .string() 
            .toLowerCase() 
            .refine((val) => ["open", "canceled", "in progress", "closed"].includes(val), 
                { message: "status type as must be either Open, Canceled, In progress, or Closed" }
            )
            .transform((val) => {
                if (val === 'open') return StatusJob.OPEN 
                if (val === 'in progress') return StatusJob.IN_PROGRESS 
                if (val === 'canceled') return StatusJob.CANCELED
                return StatusJob.CLOSED
            })
            .optional(),
        startTime: z
            .string()
            .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Format must be HH:mm")
            .optional(),
        endTime: z
            .string()
            .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Format must be HH:mm")
            .optional(),
        startDate: z
            .string()
            .regex(/^\d{4}-\d{2}-\d{2}$/)
            .optional(),
        endDate: z
            .string()
            .regex(/^\d{4}-\d{2}-\d{2}$/)
            .optional(),
    }).superRefine((data, ctx) => {

        // ===== TIME VALIDATION =====
        if (data.startTime && data.endTime) {
            const [sh=0, sm=0] = data.startTime.split(":").map(Number)
            const [eh=0, em=0] = data.endTime.split(":").map(Number)

            const start = sh * 60 + sm
            const end = eh * 60 + em

            if (end <= start) {
                ctx.addIssue({
                    code: "custom",
                    message: "endTime must be greater than startTime",
                    path: ["endTime"]
                })
            }
        }
        if (data.endTime && !data.startTime) {
            ctx.addIssue({
                code: "custom",
                message: "startTime must be provided if endTime is filled",
                path: ["startTime"]
            })
        }

        // ===== DATE VALIDATION =====
        if (data.startDate) {
            const inputDate = new Date(data.startDate)
            const today = new Date()
            today.setHours(0,0,0,0)
            inputDate.setHours(0,0,0,0)

            if (inputDate < today) {
                ctx.addIssue({
                    code: "custom",
                    message: "startDate cannot be less than today",
                    path: ["startDate"]
                })
            }
        }
        if (data.startDate && data.endDate) {
            const start = new Date(data.startDate)
            const end = new Date(data.endDate)

            if (end < start) {
                ctx.addIssue({
                    code: "custom",
                    message: "endDate must be greater than startDate",
                    path: ["endDate"]
                })
            }
        }
        if (data.endDate && !data.startDate) {
            ctx.addIssue({
                code: "custom",
                message: "startDate must be provided if endDate is filled",
                path: ["startDate"]
            })
        }

        // ===== BUDGET VALIDATION =====
        if (data.budgetMin && data.budgetMax) {
            if (data.budgetMax < data.budgetMin) {
                ctx.addIssue({
                    code: "custom",
                    message: "budgetMax must be greater than budgetMin",
                    path: ["budgetMax"]
                })
            }
        }
        if ((data.budgetMin || data.budgetMax) && !data.budgetType) {
            ctx.addIssue({
                code: "custom",
                message: "budgetType required when budget is provided",
                path: ["budgetType"]
            })
        }
        // if (data.budgetMax && !data.budgetMin) {
        //     ctx.addIssue({
        //         code: "custom",
        //         message: "budgetMin must be provided if budgetMax is filled",
        //         path: ["budgetMin"]
        //     })
        // }
        if (data.budgetType && !data.budgetMin && !data.budgetMax) {
            ctx.addIssue({
                code: "custom",
                message: "budgetType cannot be filled without budgetMin or budgetMax",
                path: ["budgetType"]
            })
        }
    }) 

}

export type CreateJobRequest = z.infer<typeof JobsValidation.CREATE_SCHEMA>
export type ListMyCreatedJob = z.infer<typeof JobsValidation.LIST_JOB_SCHEMA>
export type SearchPublicJob = z.infer<typeof JobsValidation.SEARCH_JOB_SCHEMA>
export type UpdateJob = z.infer<typeof JobsValidation.UPDATE_SCHEMA>