import { config } from "../config/env";
import { Redis } from "ioredis";

export const redis = new Redis({
    port: config.REDIS_PORT,
    host: config.REDIS_HOST,
    password: config.REDIS_PASSWORD,
    db: config.REDIS_DB
})

export async function saveRefreshToken(id: string, jti: string, token: string, ttlSeconds: number) {
    return redis.set(`refresh:${id}:${jti}`, token, "EX", ttlSeconds)
}

export async function getRefreshToken(id: string, jti: string) {
    return redis.get(`refresh:${id}:${jti}`)
}

export async function deleteRefreshToken(id: string, jti: string) {
    return redis.del(`refresh${id}:${jti}`)
}