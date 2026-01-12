import express from "express"
import { ExampleController } from "../../controller/example.controller"

export const publicRouter = express.Router()

// router tanpa/tidak perlu login
publicRouter.post("/api/example", ExampleController.controller)