import { NotificationJobData } from "./notification.job";
import { notificationQueue } from "./notification.queue";

export async function enqueueNotification(data: NotificationJobData): Promise<void> {
    await notificationQueue.add('send-notification', data, {
        jobId: data.id
    })
}

export async function enqueueManyNotifications(datas: NotificationJobData[]): Promise<void> {
    const jobs = datas.map(data => ({
        name: 'send-notification',
        data,
        opts: { jobId: data.id }
    }))

    await notificationQueue.addBulk(jobs)
}