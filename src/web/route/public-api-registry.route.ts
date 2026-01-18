import express from "express"
import { AuthController } from "../../controller/auth.controller"

export const publicRouter = express.Router()

// router tanpa/tidak perlu login
// AUTH 
publicRouter.post("/api/auth/register", AuthController.register)
publicRouter.post("/api/auth/login", AuthController.login)
publicRouter.post("/api/auth/refresh", AuthController.renewToken)