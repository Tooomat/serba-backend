import express from "express"
import { ErrorHandlerMiddleware } from "../web/middleware/web-error-handler.middleware";
import router from "../web/route";
import cookieParser from "cookie-parser";

export const webApp = express();

webApp.use(express.json())
webApp.use(cookieParser())
webApp.use(router)
webApp.use(ErrorHandlerMiddleware)

