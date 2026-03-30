import express from "express"
import { AuthController } from "../../controller/auth.controller"
import { JobsController } from "../../controller/jobs.controller"
import { EmailVerificationsController } from "../../controller/email-verifications.controller"
import { authRateLimit, publicRateLimit } from "../middleware/security.middleware"

export const publicRouter = express.Router()

publicRouter.use(publicRateLimit)

// router tanpa/tidak perlu login
// auth 
publicRouter.post("/public/api/auth/register", authRateLimit, AuthController.register)
publicRouter.post("/public/api/auth/login", authRateLimit, AuthController.login)
publicRouter.post("/public/api/auth/refresh", authRateLimit, AuthController.renewToken)

// verifications
publicRouter.post("/public/api/emailVerifications/send-verification", authRateLimit, EmailVerificationsController.send)
publicRouter.get("/public/api/emailVerifications/verify", EmailVerificationsController.verify)

// landing page
publicRouter.get("/public/api/jobs", JobsController.listPublicJob)