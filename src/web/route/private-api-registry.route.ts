import express from "express"
import { AuthMiddleware } from "../middleware/auth.middleware"
import { AuthController } from "../../controller/auth.controller"
export const privateRouter = express.Router()

privateRouter.use(AuthMiddleware.checkAuthorization)

// auth
privateRouter.post("/api/auth/logout", AuthController.logout)