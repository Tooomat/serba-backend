import { config } from "../config/env";
import { Redis } from "ioredis";

export const redis = new Redis({
    port: config.REDIS_PORT,
    host: config.REDIS_HOST,
    password: config.REDIS_PASSWORD,
    db: config.REDIS_DB
})