import { NextFunction, Response } from "express";
import { AuthRequest } from "../web/middleware/auth.middleware";
import { UsersService } from "../service/users.service";
import { success_handler } from "../web/http/web-response.http";

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
}