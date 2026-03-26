import { Queue } from "bullmq";
import { redisConnection } from "../../application/redis";

// queue PRODUCERS
export const queueName = 'notifications'

export const notificationQueue = new Queue(queueName, {
    connection: redisConnection,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: 'exponential', // retry after [2 ^ (attempts - 1) * delay] ms
            delay: 1000 // ms
        },
        removeOnComplete: true, // job selesai langsung dihapus
        removeOnFail: 100 // simpan maksimal 100 job failed terakhir
    }
})