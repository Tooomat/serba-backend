import { describe, it, expect, beforeEach, afterEach, afterAll } from '@jest/globals'
import supertest from "supertest"
import * as server from "../src/application/server"
import { prismaClient } from "../src/application/database"
import { redis } from "../src/application/redis"
import bcrypt from "bcrypt"

describe("POST /public/api/auth/login", () => {

    beforeEach(async () => {
        await prismaClient.user.deleteMany({
            where: {
                username: {
                    in: ['loginuser', 'blockeduser']
                }
            }
        })

        const hashed = await bcrypt.hash("Password123!", 10)

        await prismaClient.user.create({
            data: {
                username: "loginuser",
                email: "login@example.com",
                password: hashed,
                firstName: "Login",
                birthDate: new Date("2000-01-01"),
                phone: "+628123456789",
                role: "USER",
                status: "ACTIVE"
            }
        })

        await prismaClient.user.create({
            data: {
                username: "blockeduser",
                email: "blocked@example.com",
                password: hashed,
                firstName: "Blocked",
                birthDate: new Date("2000-01-01"),
                phone: "+628123456788",
                role: "USER",
                status: "BLOCKED"
            }
        })
    })

    afterEach(async () => {
        await prismaClient.user.deleteMany({
            where: {
                username: {
                    in: ['loginuser', 'blockeduser']
                }
            }
        })
        await redis.flushdb()
    })

    afterAll(async () => {
        await prismaClient.$disconnect()
        await redis.quit()
    })

    // ✅ SUCCESS
    it("should login successfully and return access token + set refresh cookie", async () => {
        const res = await supertest(server.webApp)
            .post("/public/api/auth/login")
            .set("Content-Type", "application/json")
            .send({
                usernameOrEmail: "loginuser",
                password: "Password123!"
            })

        expect(res.status).toBe(200)
        expect(res.body.success).toBe(true)
        expect(res.body.data.accessToken).toBeDefined()

        const cookies = res.headers['set-cookie']
        expect(cookies).toBeDefined()
        expect(cookies[0]).toContain("refresh_token=")
        expect(cookies[0]).toContain("HttpOnly")
    })

    // ❌ INVALID PASSWORD
    it("should reject login with wrong password", async () => {
        const res = await supertest(server.webApp)
            .post("/public/api/auth/login")
            .set("Content-Type", "application/json")
            .send({
                usernameOrEmail: "loginuser",
                password: "WrongPassword"
            })

        expect(res.status).toBe(401)
        expect(res.body.success).toBe(false)
    })

    // ❌ USER NOT FOUND
    it("should reject login if user not found", async () => {
        const res = await supertest(server.webApp)
            .post("/public/api/auth/login")
            .set("Content-Type", "application/json")
            .send({
                usernameOrEmail: "unknown",
                password: "Password123!"
            })

        expect(res.status).toBe(401)
        expect(res.body.success).toBe(false)
    })

    // ❌ BLOCKED USER
    it("should reject login for blocked user", async () => {
        const res = await supertest(server.webApp)
            .post("/public/api/auth/login")
            .set("Content-Type", "application/json")
            .send({
                usernameOrEmail: "blockeduser",
                password: "Password123!"
            })

        expect(res.status).toBe(403)
        expect(res.body.success).toBe(false)
    })
})
