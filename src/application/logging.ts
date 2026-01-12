import winston from "winston";
import * as env from "../config/env"

export const logger = winston.createLogger({
    level: env.config.NODE_ENV === "development" ? "debug" : "info",
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.Console(), //kirim ke console
        //new winston.transports.File({ filename: 'combined.log' })
    ]
})