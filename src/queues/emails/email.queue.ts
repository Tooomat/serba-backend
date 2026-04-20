import { Queue } from "bullmq";
import { redisConnection } from "../../application/redis";

export const emailQueueName = 'email'
export const emailQueue = new Queue(emailQueueName, {
    connection: redisConnection,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 2000
        },
        removeOnComplete: true,
        removeOnFail: {
            age: 1 * 24 * 3600 // simpan 1 hari kalau gagal
        }
    }
})