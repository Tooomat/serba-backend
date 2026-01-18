import { NextFunction, Request, Response } from "express";
import { loginRequest, registerRequest } from "../model/auth.model";
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

    static async login(req: Request, res: Response, next: NextFunction) {
        try {
            const request: loginRequest = req.body as loginRequest

            const result = await AuthService.login(request, res)

            success_handler(res, "login successful", result, 200)
        } catch (e) {
            next(e)
        }
    }

    static async renewToken(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await AuthService.renewToken(req)

            success_handler(res, "Successful generate new token", result, 200)
        } catch (e) {
            next(e)
        }
    }
}