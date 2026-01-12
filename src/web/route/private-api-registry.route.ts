import express from "express"
import { ExampleController } from "../../controller/example.controller"

export const privateRouter = express.Router()

// privateRouter.use(authMiddleware)

privateRouter.post("/", ExampleController.controller)
// userPrivateRouter.get("/", UserController.getMe)
// userPrivateRouter.post("/logout", UserController.logout)