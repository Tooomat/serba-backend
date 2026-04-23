import { createHash } from "crypto"
import { BudgetTypeJob, JobSite, LevelJob, NotificationType, StatusJob, statusJobApplication, StatusUser, TypeJob } from "../generated/prisma/enums"

export const formater = {
    userFormatter: {
        status: (status: StatusUser): string => {
            const map: Record<StatusUser, string> = {
                [StatusUser.PENDING_VERIFICATION]: 'Pending Verification',
                [StatusUser.ACTIVE]: 'Active',
                [StatusUser.BLOCKED]: 'Blocked'
            }

            return map[status] || status
        }
    },

    JobFormatters: {
        type: (type: TypeJob): string => {
            const map: Record<TypeJob, string> = {
                [TypeJob.URGENT]: 'Urgent',
                [TypeJob.NON_URGENT]: 'Non Urgent'
            }
            return map[type] || type
        },
        
        site: (site: JobSite): string => {
            const map: Record<JobSite, string> = {
                [JobSite.ON_SITE]: 'On Site',
                [JobSite.REMOTE]: 'Remote',
                [JobSite.HYBRID]: 'Hybrid'
            }
            return map[site] || site
        },
        
        level: (level: LevelJob): string => {
            const map: Record<LevelJob, string> = {
                [LevelJob.BEGINNER]: 'Beginner',
                [LevelJob.INTERMEDIATE]: 'Intermediate',
                [LevelJob.ADVANCED]: 'Advanced',
                [LevelJob.EXPERT]: 'Expert'
            }
            return map[level] || level
        },
        
        status: (status: StatusJob): string => {
            const map: Record<StatusJob, string> = {
                [StatusJob.OPEN]: 'Open',
                [StatusJob.IN_PROGRESS]: 'In Progress',
                [StatusJob.CANCELED]: 'Canceled',
                [StatusJob.CLOSED]: 'Closed'
            }
            return map[status] || status
        },
        
        budgetType: (budgetType: BudgetTypeJob): string => {
            const map: Record<BudgetTypeJob, string> = {
                [BudgetTypeJob.FIXED]: 'Fixed',
                [BudgetTypeJob.HOURLY]: 'Hourly',
                [BudgetTypeJob.DAILY]: 'Daily',
                [BudgetTypeJob.MONTHLY]: 'Monthly',
                [BudgetTypeJob.NEGOTIABLE]: 'Negotiable'
            }
            return map[budgetType] || budgetType
        }
    },

    jobApplicationFormater: {
        status: (statusApp: statusJobApplication): string => {
            const map: Record<statusJobApplication, string> = {
                [statusJobApplication.ACCEPTED]: 'Accepted',
                [statusJobApplication.SHORTLISTED]: 'Shortlisted',
                [statusJobApplication.APPLIED]: 'Applied',
                [statusJobApplication.REJECTED]: 'Rejected',
                [statusJobApplication.REVIEWED]: 'Reviewed'
            }
            return map[statusApp] || statusApp
        }
    },

    notificationsFormater: {
        type: (type: NotificationType): string => {
            const map: Record<NotificationType, string> = {
                [NotificationType.JOB_ACCEPTED]: 'Job Accepted',
                [NotificationType.JOB_APPLIED]: 'Job Applied',
                [NotificationType.JOB_REJECTED]: 'Job Rejected',
                [NotificationType.JOB_REVIEWED]: 'Job Reviewed'
            }

            return map[type] || status
        }
    },

    hashPII(value: string): string {
        return createHash('sha256').update(value).digest('hex').substring(0, 16)
    },

    maskEmail(email: string): string {
        const [local, domain] = email.split('@')
        const masked = local![0] + '*'.repeat(Math.max(local!.length - 2, 1)) + local![local!.length - 1]
        return `${masked}@${domain}`
    },

    maskPhone(phone: string): string {
        // if (phone.length < 8) return '****'

        const prefix = phone.slice(0, 5)
        const suffix = phone.slice(-4)
        const masked = '*'.repeat(phone.length - 9)

        return `${prefix}${masked}${suffix}`
    },

    toArray(value: any): string[] | undefined {
        if (!value) return undefined
        return Array.isArray(value) ? value : [value]
    },

    getFullName(first: string, last?: string | null): string {
        return last ? `${first} ${last}` : first
    }
}   