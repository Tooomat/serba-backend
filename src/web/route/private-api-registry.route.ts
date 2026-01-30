import express from "express"
import { AuthMiddleware } from "../middleware/auth.middleware"
import { AuthController } from "../../controller/auth.controller"
import { JobCategoriesController } from "../../controller/job-categories.controller"
export const privateRouter = express.Router()

privateRouter.use(AuthMiddleware.checkAuthorization)

// auth
privateRouter.post("/api/auth/logout", AuthController.logout)

// job categories
privateRouter.get("/api/jobCategories", JobCategoriesController.getAll)
privateRouter.get("/api/jobCategories/:jobCategoryId", JobCategoriesController.get)