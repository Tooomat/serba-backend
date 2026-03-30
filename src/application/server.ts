import express from "express"
import { ErrorHandlerMiddleware } from "../web/middleware/web-error-handler.middleware";
import router from "../web/route";
import cookieParser from "cookie-parser";
import path from "path";
import "../queues/notifications/notification.worker";
import "../queues/emails/email.worker";
import { 
  corsGuard, 
  helmetGuard, 
  hppMiddleware, 
  xssProtection 
} from "../web/middleware/security.middleware";
import { config } from "../config/env";
import { requestLogger } from "./logging";

const isProd = config.NODE_ENV === 'production'

export const webApp = express();

webApp.set('trust proxy', isProd ? 1 : false)

webApp.use(helmetGuard)

webApp.use(corsGuard)

webApp.use(requestLogger) // OWASP

webApp.use(express.json())
webApp.use(express.urlencoded({ extended: true }))
webApp.use(cookieParser())

webApp.use(hppMiddleware)

webApp.use(xssProtection)

webApp.use(
  "/public",
  express.static(path.join(process.cwd(), "public"))
)

webApp.use(router)

webApp.use(ErrorHandlerMiddleware)