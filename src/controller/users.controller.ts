import { NextFunction, Response } from "express";
import { AuthRequest } from "../web/middleware/auth.middleware";
import { UsersService } from "../service/users.service";
import { success_handler } from "../web/http/web-response.http";
import { updateUserRequest, UploadUpdateProfilePict } from "../model/users.model";

export class UsersController {
    static async current(auth: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { id: userId } = auth.user!

            const result = UsersService.current(userId)
            success_handler(res, "get user successful", result, 200)
        } catch (e) {
            next(e)
        }
    }

    static async update(auth: AuthRequest, res: Response, next: NextFunction) {
        try {
            const request: updateUserRequest = auth.body as updateUserRequest
            const { id: userId } = auth.user!

            const result = UsersService.update(userId, request)
            success_handler(res, "Update profile successful", result, 200)
        } catch (e) {
            next(e)
        }
    }

    static async updateProfilePict(auth: AuthRequest, res: Response, next: NextFunction) {
        try {
            const file: UploadUpdateProfilePict | undefined = auth.file 
            ? ({ 
                    buffer: auth.file.buffer, 
                    mimetype: auth.file.mimetype, 
                    originalname: auth.file.originalname 
                } as UploadUpdateProfilePict) 
            : undefined

            const { id: userId } = auth.user!

            const result = UsersService.updateProfilePict(userId, file)
            success_handler(res, "Update profile picture successful", result, 200)
        } catch (e) {
            next(e)
        }
    }

    static async ownProfile(auth: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { id: userId } = auth.user!
            const result = UsersService.profile(userId, true)

            success_handler(res, "Get own profile successfully", result, 200)
        } catch (e) {
            next(e)
        }
    }

    static async otherProfile(auth: AuthRequest, res: Response, next: NextFunction) {
        try {
            const visitedUserId: string = String(auth.params.userId)
            const result = UsersService.profile(visitedUserId, false)
            success_handler(res, "Get other profile successfully", result, 200)
        } catch (e) {
            next(e)
        }
    }

    static async deleteProfilePict(auth: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { id: userId } = auth.user!
            const result = UsersService.deleteProfilePict(userId)
            success_handler(res, "Delete profile picture successful", result, 200)
        } catch (e) {
            next(e)
        }
    }
}