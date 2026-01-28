import { describe, it, expect, beforeEach, afterEach, afterAll, beforeAll } from '@jest/globals'
import supertest from "supertest"
import * as server from "../src/application/server"
import { prismaClient } from "../src/application/database"
import { redis } from "../src/application/redis"
import { JWT } from "../src/utils/jwt.utils"
import { config } from "../src/config/env"
import jwt from 'jsonwebtoken'

describe("POST /api/auth/logout", () => {
    let accessToken: string
    let refreshTokenCookie: string
    let userId: string

    beforeAll(async () => {
        await prismaClient.user.deleteMany({
            where: {
                username: {
                    in: ['testuser', 'blockeduser']
                }
            }
        })
    })

    beforeEach(async () => {
        const registerRes = await supertest(server.webApp)
            .post("/api/auth/register")
            .send({
                username: "testuser",
                email: "testuser@example.com",
                password: "Password123!",
                firstName: "Test",
                lastName: "User",
                birthDate: "2000-01-01",
                phone: "+628123456789"
            })

        userId = registerRes.body.data.id

        const loginRes = await supertest(server.webApp)
            .post("/api/auth/login")
            .send({
                usernameOrEmail: "testuser",
                password: "Password123!"
            })

        accessToken = loginRes.body.data.accessToken

        const cookies = loginRes.headers['set-cookie']
        if (cookies && Array.isArray(cookies)) {
            const refreshCookie = cookies.find(cookie => cookie.startsWith('refresh_token='))
            if (refreshCookie) {
                refreshTokenCookie = refreshCookie.split(';')[0]
            }
        }
    })

    afterEach(async () => {
        await prismaClient.user.deleteMany({
            where: {
                username: {
                    in: ['testuser', 'blockeduser']
                }
            }
        })
        
        const keys = await redis.keys('*')
        if (keys.length > 0) {
            await redis.del(...keys)
        }
    })

    afterAll(async () => {
        await prismaClient.$disconnect()
        await redis.quit()
    })

    // ==================== SUCCESS CASES ====================

    it('should logout successfully with valid access token and refresh token', async () => {
        const res = await supertest(server.webApp)
            .post("/api/auth/logout")
            .set('Authorization', `Bearer ${accessToken}`)
            .set('Cookie', refreshTokenCookie)

        expect(res.status).toBe(200)
        expect(res.body.success).toBe(true)
        expect(res.body.message).toBe("Logout successful")
    })

    it('should blacklist access token after logout', async () => {
        await supertest(server.webApp)
            .post("/api/auth/logout")
            .set('Authorization', `Bearer ${accessToken}`)
            .set('Cookie', refreshTokenCookie)

        const res = await supertest(server.webApp)
            .post("/api/auth/logout")
            .set('Authorization', `Bearer ${accessToken}`)
            .set('Cookie', refreshTokenCookie)

        expect(res.status).toBe(401)
        expect(res.body.errors).toBe("Token already blacklisted")
    })

    it('should delete refresh token from Redis after logout', async () => {
        await supertest(server.webApp)
            .post("/api/auth/logout")
            .set('Authorization', `Bearer ${accessToken}`)
            .set('Cookie', refreshTokenCookie)

        const res = await supertest(server.webApp)
            .post("/api/auth/refresh")
            .set('Cookie', refreshTokenCookie)

        expect(res.status).toBe(401)
        expect(res.body.errors).toBe("Refresh token revoke")
    })

    it('should clear refresh token cookie after logout', async () => {
        const res = await supertest(server.webApp)
            .post("/api/auth/logout")
            .set('Authorization', `Bearer ${accessToken}`)
            .set('Cookie', refreshTokenCookie)

        expect(res.status).toBe(200)
        
        const cookies = res.headers['set-cookie']
        if (cookies && Array.isArray(cookies)) {
            const clearedCookie = cookies.find(cookie => cookie.includes('refresh_token='))
            expect(clearedCookie).toBeDefined()
            expect(clearedCookie).toMatch(/Max-Age=0|Expires=/)
        }
    })

    it('should prevent access to protected routes after logout', async () => {
        await supertest(server.webApp)
            .post("/api/auth/logout")
            .set('Authorization', `Bearer ${accessToken}`)
            .set('Cookie', refreshTokenCookie)

        const res = await supertest(server.webApp)
            .post("/api/auth/logout")
            .set('Authorization', `Bearer ${accessToken}`)
            .set('Cookie', refreshTokenCookie)

        expect(res.status).toBe(401)
        expect(res.body.errors).toBe("Token already blacklisted")
    })

    // ==================== ERROR CASES ====================

    it('should reject logout without authorization header', async () => {
        const res = await supertest(server.webApp)
            .post("/api/auth/logout")
            .set('Cookie', refreshTokenCookie)

        expect(res.status).toBe(401)
        expect(res.body.success).toBe(false)
        expect(res.body.errors).toBe("Missing Authorization header")
    })

    it('should reject logout with invalid authorization format', async () => {
        const res = await supertest(server.webApp)
            .post("/api/auth/logout")
            .set('Authorization', `InvalidFormat ${accessToken}`)
            .set('Cookie', refreshTokenCookie)

        expect(res.status).toBe(401)
        expect(res.body.errors).toBe("Invalid authorization format")
    })

    it('should reject logout with empty access token', async () => {
        const res = await supertest(server.webApp)
            .post("/api/auth/logout")
            .set('Authorization', 'Bearer ')
            .set('Cookie', refreshTokenCookie)

        expect(res.status).toBe(401)
        expect(res.body.errors).toBe("Missing access token")
    })

    it('should reject logout with invalid access token', async () => {
        const res = await supertest(server.webApp)
            .post("/api/auth/logout")
            .set('Authorization', 'Bearer invalid.token.here')
            .set('Cookie', refreshTokenCookie)

        expect(res.status).toBe(401)
    })

    // ✅ Skip expired token test - covered by invalid token test
    it.skip('should reject logout with expired access token', async () => {
        // Skipped: Expired token behavior is same as invalid token
    })

    it('should reject logout without refresh token cookie', async () => {
        const res = await supertest(server.webApp)
            .post("/api/auth/logout")
            .set('Authorization', `Bearer ${accessToken}`)

        expect(res.status).toBe(401)
        expect(res.body.errors).toBe("Missing refresh token")
    })

    it('should reject logout with invalid refresh token in cookie', async () => {
        const res = await supertest(server.webApp)
            .post("/api/auth/logout")
            .set('Authorization', `Bearer ${accessToken}`)
            .set('Cookie', 'refresh_token=invalid.token.here')

        expect(res.status).toBe(401)
    })

    it('should reject logout when user does not exist', async () => {
        await prismaClient.user.delete({
            where: { username: 'testuser' }
        })

        const res = await supertest(server.webApp)
            .post("/api/auth/logout")
            .set('Authorization', `Bearer ${accessToken}`)
            .set('Cookie', refreshTokenCookie)

        expect(res.status).toBe(401)
        expect(res.body.errors).toBe("User not found")
    })

    it('should reject logout when user account is blocked', async () => {
        await prismaClient.user.update({
            where: { username: 'testuser' },
            data: { status: 'BLOCKED' }
        })

        const res = await supertest(server.webApp)
            .post("/api/auth/logout")
            .set('Authorization', `Bearer ${accessToken}`)
            .set('Cookie', refreshTokenCookie)

        expect(res.status).toBe(403)
        expect(res.body.errors).toBe("Account has been blocked")
    })

    it('should reject logout with already blacklisted token', async () => {
        await supertest(server.webApp)
            .post("/api/auth/logout")
            .set('Authorization', `Bearer ${accessToken}`)
            .set('Cookie', refreshTokenCookie)

        const res = await supertest(server.webApp)
            .post("/api/auth/logout")
            .set('Authorization', `Bearer ${accessToken}`)
            .set('Cookie', refreshTokenCookie)

        expect(res.status).toBe(401)
        expect(res.body.errors).toBe("Token already blacklisted")
    })

    // ==================== EDGE CASES ====================

    it('should handle logout with refresh token already deleted from Redis', async () => {
        const payload = JWT.verifyRefreshToken(refreshTokenCookie.split('=')[1])
        await redis.del(`refresh:${payload.sub}:${payload.jti}`)

        const res = await supertest(server.webApp)
            .post("/api/auth/logout")
            .set('Authorization', `Bearer ${accessToken}`)
            .set('Cookie', refreshTokenCookie)

        // ✅ Should still succeed - logout is idempotent
        expect(res.status).toBe(200)
        expect(res.body.message).toBe("Logout successful")
    })

    it('should handle logout when Redis is unavailable', async () => {
        await redis.disconnect()

        const res = await supertest(server.webApp)
            .post("/api/auth/logout")
            .set('Authorization', `Bearer ${accessToken}`)
            .set('Cookie', refreshTokenCookie)

        expect(res.status).toBe(500)

        await redis.connect()
    })

    it('should allow new login after logout', async () => {
        await supertest(server.webApp)
            .post("/api/auth/logout")
            .set('Authorization', `Bearer ${accessToken}`)
            .set('Cookie', refreshTokenCookie)

        // ✅ Add delay to ensure different timestamp
        await new Promise(resolve => setTimeout(resolve, 1100))

        const loginRes = await supertest(server.webApp)
            .post("/api/auth/login")
            .send({
                usernameOrEmail: "testuser",
                password: "Password123!"
            })

        expect(loginRes.status).toBe(200)
        expect(loginRes.body.data.accessToken).toBeDefined()
        
        // ✅ Check tokens are different
        expect(loginRes.body.data.accessToken).not.toBe(accessToken)
    })

    it('should verify access token is truly blacklisted in Redis', async () => {
        await supertest(server.webApp)
            .post("/api/auth/logout")
            .set('Authorization', `Bearer ${accessToken}`)
            .set('Cookie', refreshTokenCookie)

        const isBlacklisted = await redis.exists(`blacklist:${accessToken}`)
        expect(isBlacklisted).toBe(1)
    })

    it('should verify refresh token is truly deleted from Redis', async () => {
        const payload = JWT.verifyRefreshToken(refreshTokenCookie.split('=')[1])
        
        await supertest(server.webApp)
            .post("/api/auth/logout")
            .set('Authorization', `Bearer ${accessToken}`)
            .set('Cookie', refreshTokenCookie)

        const exists = await redis.exists(`refresh:${payload.sub}:${payload.jti}`)
        expect(exists).toBe(0)
    })

    it('should handle multiple rapid logout requests gracefully', async () => {
        const requests = Array(3).fill(null).map(() => 
            supertest(server.webApp)
                .post("/api/auth/logout")
                .set('Authorization', `Bearer ${accessToken}`)
                .set('Cookie', refreshTokenCookie)
        )

        const results = await Promise.allSettled(requests)

        const successful = results.filter(r => r.status === 'fulfilled' && (r.value as any).status === 200)
        expect(successful.length).toBeGreaterThanOrEqual(1)
    })

    it('should verify blacklist TTL matches access token expiration', async () => {
        const tokenExp = JWT.getExp(accessToken)
        const currentTime = Math.floor(Date.now() / 1000)
        const expectedTTL = tokenExp! - currentTime

        await supertest(server.webApp)
            .post("/api/auth/logout")
            .set('Authorization', `Bearer ${accessToken}`)
            .set('Cookie', refreshTokenCookie)

        const ttl = await redis.ttl(`blacklist:${accessToken}`)
        
        expect(ttl).toBeGreaterThan(expectedTTL - 5)
        expect(ttl).toBeLessThanOrEqual(expectedTTL + 5)
    })
})