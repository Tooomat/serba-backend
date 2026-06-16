import { Worker } from "bullmq"
import { queueName } from "./notification.queue"
import { redisConnection } from "../../application/redis"
import { NotificationJobData } from "./notification.job"
import { prismaClient } from "../../application/database"
import { logger } from "../../application/logging"

// worker CONSUMERS
export const notificationWorker = new Worker<NotificationJobData>(
    queueName, 
    async (job) => {
        const data: NotificationJobData = job.data as NotificationJobData
        await prismaClient.notifications.create({
            data: {
                id: data.id,
                type: data.type,
                title: data.title,
                message: data.message,
                userId: data.userId,
                jobApplicationId: data.jobApplicationId
            }
        })
    },
    { 
        connection: redisConnection,
        concurrency: 5 // process 5 data di satu waktu
    }
)

notificationWorker.on('completed', (job) => {
    console.log(`Notification job ${job.id} completed`)

    logger.info({
        type: 'notification:completed',
        jobId: job.id,
        userId: job.data.userId,
        notifType: job.data.type
    })
})

notificationWorker.on('failed', (job, err) => {
    console.error(`Notification job ${job?.id} failed:`, err.message)
    logger.error({
        type: 'notification:failed',
        jobId: job?.id,
        userId: job?.data.userId,
        notifType: job?.data.type,
        attempts: job?.attemptsMade,
        error: err.message
    })
})