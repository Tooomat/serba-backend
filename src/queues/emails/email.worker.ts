import { Worker } from "bullmq";
import { EmailJobData } from "./email.job";
import { emailQueueName } from "./email.queue";
import { resend } from "./mailer";
import { redisConnection } from "../../application/redis";
import { logger } from "../../application/logging";

const from = process.env.EMAIL_FROM || "Acme <onboarding@resend.dev>"

export const emailWorker = new Worker<EmailJobData> (
    emailQueueName,
    async (job) => {
        const data: EmailJobData = job.data as EmailJobData

        await resend.emails.send({
            from: from,
            to: data.to,
            subject: data.subject,
            html: data.html,
            text: "Welcome! This email was sent using Resend's Node.js SDK."
        })
    },
    {
        connection: redisConnection,
        concurrency: 5,
        limiter: {
            max: 10,       // max 10 email
            duration: 1000 // per detik (sesuai limit Resend)
        }
    }
)

emailWorker.on('completed', (job) => {
    console.log(`Email sent to ${job.data.to}`)
})

emailWorker.on('failed', (job, err) => {
    console.error(`Email failed to ${job?.data.to}:`, err.message)
    
    logger.error({
        type: 'email:failed',
        jobEmailId: job?.id,
        to: job?.data.to,
        emailType: job?.data.type,
        attempts: job?.attemptsMade,
        error: err.message
    })
})