import { Response, Request, NextFunction } from "express";
import { EmailVerificationsService } from "../service/email-verifications.service";
import { success_handler } from "../web/http/web-response.http";
import { sendEmailVerificationRequest, verifyEmailQuery } from "../model/email-verifications.model";
import { securityLogger } from "../utils/logging.utils";

export class EmailVerificationsController {
    static async send(req: Request, res: Response, next: NextFunction) {
        try {
            const request: sendEmailVerificationRequest = req.body as sendEmailVerificationRequest
            const result = await EmailVerificationsService.send(request)

            success_handler(res, "Verification link sent to email", result, 200)
        } catch (error) {
            next(error)
        }
    }

    static async verify(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const request: verifyEmailQuery = {
                token: String(req.query.token)
            }
            
            const result = await EmailVerificationsService.verify(request)
            
            securityLogger.emailVerified(
                result.userId,
                req.ip ?? 'unknown'
            )
            success_handler(res, "Email verified successful", result.emailVerifiedAt, 200)
        } catch (error) {
            next(error)
        }
    }
}