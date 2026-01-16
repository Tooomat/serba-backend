import * as env from "../config/env"
import winston from "winston";

export const logger = winston.createLogger({
    // logging.ts
    level: (env.config.NODE_ENV === "development" || env.config.NODE_ENV === "test") ? "debug" : "info",
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.Console(), //kirim ke console
        //new winston.transports.File({ filename: 'combined.log' })
    ]
})

