import { randomUUID } from "crypto";
import { EmailJobData } from "./email.job";
import { emailQueue } from "./email.queue";

export async function enqueueEmail(data: EmailJobData): Promise<void> {
    await emailQueue.add('send-email', data, {
        jobId: `email-${data.type}-${randomUUID()}`
    })
}

export async function enqueueManyEmails(datas: EmailJobData[]): Promise<void> {
    const jobs = datas.map(data => ({
        name: 'send-email',
        data,
        opts: {
            jobId: `email-${data.type}-${randomUUID()}`
        }
    }))
    await emailQueue.addBulk(jobs)
}