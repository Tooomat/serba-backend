import { is } from "zod/v4/locales";
import { config } from "../config/env";
import { Redis } from "ioredis";
import { ResponseError } from "../error/service-response.error";

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
    return redis.del(`refresh:${id}:${jti}`)
}

export async function blacklistAccessToken(token: string, expInSeconds: number) {
    const currentTime = Math.floor(Date.now() / 1000)
    const ttl = expInSeconds - currentTime
    
    if (ttl > 0) {
        return redis.set(`blacklist:${token}`, "1", "EX", ttl)
    }
    
    return null
}

export async function isBlacklisted(token: string): Promise<boolean> {
    const result = await redis.exists(`blacklist:${token}`)
    return result === 1
}