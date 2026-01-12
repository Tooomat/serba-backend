import { Redis } from "ioredis";
import { config } from "../config/env";

export const redis = new Redis({
    port: config.REDIS_PORT,
    host: config.REDIS_HOST,
    password: config.REDIS_PASSWORD,
    db: config.REDIS_DB
})