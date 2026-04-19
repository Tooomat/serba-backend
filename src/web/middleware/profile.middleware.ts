import { Response, NextFunction } from "express"
import { AuthRequest } from "./auth.middleware"
import { ResponseError } from "../../error/service-response.error"

export class ProfileMiddleware {
    static requireCompleteProfile(req: AuthRequest, res: Response, next: NextFunction) {
        if (!req.user?.isProfileComplete) {
            throw new ResponseError(403, "Please complete your profile first")
        }
        next()
    }
}