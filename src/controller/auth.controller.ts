import { NextFunction, Request, Response } from "express";
import { registerRequest, registerResponse } from "../model/user.model";
import { AuthService } from "../service/auth.service";
import { success_handler } from "../web/http/web-response.http";

export class AuthController {
    static async register(req: Request, res: Response, next: NextFunction) {
        try {
            const request: registerRequest = req.body as registerRequest

            const result = await AuthService.register(request)

            success_handler(res, "Registration successful", result, 201)
        } catch (e) {
            next(e)
        }
    }
}