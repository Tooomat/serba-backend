import { Response, NextFunction } from "express"
import { AuthRequest } from "./auth.middleware"
import { prismaClient } from "../../application/database"
import { ResponseError } from "../../error/service-response.error"

export class Verification {
    static async requireEmailVerified(auth: AuthRequest, res: Response, next: NextFunction) {
        const userId = auth.user!.id
    
        const user = await prismaClient.user.findUnique({
            where: {
                id: userId
            },
            select: {
                isEmailVerified: true,
                emailVerifiedAt: true,
            }
        })
    
        if (!user) {
            return next(new ResponseError(404, "User not found"))
        }
    
        if (!user.isEmailVerified || !user.emailVerifiedAt) {
            return next(new ResponseError(403, "Verify your email first"))
        }
    
        next()
    }

    static async requirePhoneVerified(auth: AuthRequest, res: Response, next: NextFunction) {
        // TODO: middleware unutk mengecek user sudah verifikasi phone number atau belum
        const userId = auth.user!.id
    
        const user = await prismaClient.user.findUnique({
            where: {
                id: userId
            },
            select: {
                isPhoneVerified: true,
                phoneVerifiedAt: true,
            }
        })
    
        if (!user) {
            return next(new ResponseError(404, "User not found"))
        }
    
        if (!user.isPhoneVerified || !user.phoneVerifiedAt) {
            return next(new ResponseError(403, "Verify your phone first"))
        }
    
        next()
    }
}