import { Queue } from "bullmq";
import { redisConnection } from "../../application/redis";

export const emailQueueName = 'email'
export const emailQueue = new Queue(emailQueueName, {
    connection: redisConnection,
    prefix: 'bull:queue',
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