import { NextFunction, Request, Response } from "express";
import { loginRequest, registerRequest, UploadedFile } from "../model/auth.model";
import { AuthService } from "../service/auth.service";
import { success_handler } from "../web/http/web-response.http";
import { AuthRequest } from "../web/middleware/auth.middleware";
import { securityLogger } from "../utils/logging.utils";
import { errorUtils } from "../utils/error.utils";

export class AuthController {
    static async register(req: Request, res: Response, next: NextFunction) {
        try {
            const request: registerRequest = req.body as registerRequest
            const file: UploadedFile | undefined = req.file 
            ? ({ 
                    buffer: req.file.buffer, 
                    mimetype: req.file.mimetype, 
                    originalname: req.file.originalname 
                } as UploadedFile) 
            : undefined 

            const result = await AuthService.register(req, request, file)
            securityLogger.registered(
                result.id,
                req.ip ?? 'unknown'
            )
            success_handler(res, "Registration successful", result, 201)
        } catch (e) {
            next(e)
        }
    }

    static async login(req: Request, res: Response, next: NextFunction) {
        try {
            const request: loginRequest = req.body as loginRequest

            const result = await AuthService.login(req, request, res)
            securityLogger.loginSuccess(result.userId, req.ip ?? 'unknown')
            success_handler(res, "login successful", {
                accessToken: result.accessToken,
                isProfileComplete: result.isProfileComplete
            }, 200)
        } catch (e) {
            securityLogger.loginFailed(
                req.body.usernameOrEmail ?? 'unknown',
                req.ip ?? 'unknown',
                e instanceof Error ? e.message : 'unknown',
                errorUtils.parseErrorOrigin(e),
                (req as any).requestId
            )
            next(e)
        }
    }

    static async renewToken(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await AuthService.renewToken(req)
            
            success_handler(res, "Successful generate new token", result, 200)
        } catch (e) {
            securityLogger.invalidToken(
                req.ip ?? 'unknown',
                req.originalUrl,
                e instanceof Error ? e.message : 'unknown',
                (req as any).requestId
            )
            next(e)
        }
    }
    
    static async logout(auth: AuthRequest, res: Response, next: NextFunction) {
        try {
            const accessToken = auth.token!.accessToken 
            const exp = auth.token!.exp
            
            const result = await AuthService.logout(auth, res, accessToken, exp)
            securityLogger.logout(auth.user!.id, auth.ip ?? 'unknown')
            success_handler(res, "Logout successful", result, 200)
        } catch (e) {
            next(e)
        }
    }
}