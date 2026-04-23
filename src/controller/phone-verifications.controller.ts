import { Response, NextFunction } from "express"
import { AuthRequest } from "../web/middleware/auth.middleware"
import { PhoneVerificationService } from "../service/phone-verifications.service"
import { sendOtpRequest, verifyOtpRequest } from "../model/phone-verifications.model"
import { success_handler } from "../web/http/web-response.http"

export class PhoneVerificationController {
    static async send(auth: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { id: userId } = auth.user!
            const request: sendOtpRequest = auth.body as sendOtpRequest

            const result = PhoneVerificationService.send(userId, request)
            success_handler(res, "OTP send to phone", result, 201)
        } catch (e) {
            next(e)
        }
    }

    static async verify(auth: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { id: userId } = auth.user!
            const request: verifyOtpRequest = auth.body as verifyOtpRequest
            
            const result = PhoneVerificationService.verify(userId, request)
            success_handler(res, "Phone verified successful", result, 200)
        } catch (e) {
            next(e)
        }
    }
}