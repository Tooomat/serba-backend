import { Response, NextFunction } from "express"
import { AuthRequest } from "./auth.middleware"
import { ResponseError } from "../../error/service-response.error"
import { prismaClient } from "../../application/database"

export class ProfileMiddleware {
    static async requireActiveUser(req: AuthRequest, res: Response, next: NextFunction) {
        const user = await prismaClient.user.findUnique({
            where: {
                id: req.user!.id
            },
            select: {
                status: true
            }
        })
        
        if (!user) {
            throw new ResponseError(404, "User is not found")
        }

        if (user.status === 'PENDING_VERIFICATION') {
            throw new ResponseError(403, "Please complete your account verification first")
        }

        next()
    }

    static async requireCompleteProfile(req: AuthRequest, res: Response, next: NextFunction) {
        const user = await prismaClient.user.findUnique({
            where: {
                id: req.user!.id
            },
            select: {
                isProfileComplete: true
            }
        })

        if (!user) {
            throw new ResponseError(404, "User is not found")
        }
        if (user.isProfileComplete !== true) {
            throw new ResponseError(403, "Please complete your profile first")
        }
        
        next()
    }
}