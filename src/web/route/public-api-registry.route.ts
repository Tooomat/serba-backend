import express from "express"
import { AuthController } from "../../controller/auth.controller"

export const publicRouter = express.Router()

// router tanpa/tidak perlu login
// AUTH 
publicRouter.post("/public/api/auth/register", AuthController.register)
publicRouter.post("/public/api/auth/login", AuthController.login)
publicRouter.post("/public/api/auth/refresh", AuthController.renewToken)