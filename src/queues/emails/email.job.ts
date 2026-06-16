export enum TypeEmail {
    VERIFICATION_ACCOUNT,
    RESET_PASSWORD,
    JOB_ACCEPTED,
    JOB_REJECTED
}

export type EmailJobData = {
    id: string
    to: string
    subject: string
    html: string
    type: TypeEmail
}