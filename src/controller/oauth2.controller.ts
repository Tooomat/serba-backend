import { Request, Response, NextFunction } from "express";
import { OAuth2CallbackRequest, OAuth2Request } from "../model/oauth2.model";
import { OAuth2Service } from "../service/oauth2.service";

export class OAuth2Controller {
    static async initiateGoogleAuth(req: Request, res: Response, next: NextFunction) {
        try {
            const query: OAuth2Request = {
                redirectPath: String(req.query.redirectPath)
            }
            
            const result = await OAuth2Service.initiateGoogleAuth(query, res)
            return res.redirect(result.authUrl)
        } catch (e) {
            next(e)
        }
    }

    static async googleCallback(req: Request, res: Response, next: NextFunction) {
        try {
            const query: OAuth2CallbackRequest = {
                code: String(req.query.code),
                state: String(req.query.state)
            }

            await OAuth2Service.findOrCreateGoogleUser(query, req, res)
        } catch (e) {
            next(e)
        }
    }
}