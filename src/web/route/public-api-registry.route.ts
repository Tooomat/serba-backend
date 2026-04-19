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
import { OAuth2Controller } from "../../controller/oauth2.controller"

export const publicRouter = express.Router()

// router tanpa/tidak perlu login
// auth 
publicRouter.post("/public/api/auth/register", uploadProfilePict.single("profilePict"), authRegisterRateLimiter, AuthController.register)
publicRouter.post("/public/api/auth/login", authLoginRateLimiter, AuthController.login)
publicRouter.post("/public/api/auth/refresh", authRefreshRateLimiter, AuthController.renewToken)

// OAuth2 Google
publicRouter.get("/public/api/auth/google", authLoginRateLimiter, OAuth2Controller.initiateGoogleAuth)
publicRouter.get("/public/api/auth/google/callback", authLoginRateLimiter, OAuth2Controller.googleCallback)

// verifications email
publicRouter.post("/public/api/emailVerifications/send-verification", authEmailSendRateLimiter, EmailVerificationsController.send)
publicRouter.get("/public/api/emailVerifications/verify", authEmailVerifRateLimiter, EmailVerificationsController.verify)

// landing page
publicRouter.get("/public/api/jobs", publicRateLimit, JobsController.listPublicJob)