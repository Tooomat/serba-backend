import { BudgetTypeJob, JobSite, LevelJob, StatusJob, TypeJob } from "../generated/prisma/enums"

export const JobFormatters = {
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
}

export const toArray = (value: any): string[] | undefined => {
                            if (!value) return undefined
                            return Array.isArray(value) ? value : [value]
                        }