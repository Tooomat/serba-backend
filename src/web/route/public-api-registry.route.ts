import express from "express"
import { AuthController } from "../../controller/auth.controller"
import { JobsController } from "../../controller/jobs.controller"
import { EmailVerificationsController } from "../../controller/email-verifications.controller"
import { 
    authEmailSendRateLimiter,
    authEmailVerifRateLimiter,
    authLoginRateLimiter,
    authRefreshRateLimiter,
    authRegisterRateLimiter,
    publicRateLimit 
} from "../middleware/security.middleware"
import { uploadProfilePict } from "../middleware/upload.middleware"

export const publicRouter = express.Router()

// router tanpa/tidak perlu login
// auth 
publicRouter.post("/public/api/auth/register", uploadProfilePict.single("profilePict"), authRegisterRateLimiter, AuthController.register)
publicRouter.post("/public/api/auth/login", authLoginRateLimiter, AuthController.login)
publicRouter.post("/public/api/auth/refresh", authRefreshRateLimiter, AuthController.renewToken)

// verifications email
publicRouter.post("/public/api/emailVerifications/send-verification", authEmailSendRateLimiter, EmailVerificationsController.send)
publicRouter.get("/public/api/emailVerifications/verify", authEmailVerifRateLimiter, EmailVerificationsController.verify)

// landing page
publicRouter.get("/public/api/jobs", publicRateLimit, JobsController.listPublicJob)