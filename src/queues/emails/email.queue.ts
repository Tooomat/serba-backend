import { Queue } from "bullmq";
import { redisConnection } from "../../application/redis";

export const emailQueueName = 'emails'
export const emailQueue = new Queue(emailQueueName, {
    connection: redisConnection,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 2000
        },
        removeOnComplete: true,
        removeOnFail: false
    }
})