import { describe, it, expect, beforeEach, afterEach, afterAll } from "@jest/globals"
import supertest from "supertest"
import * as server from "../src/application/server"
import { prismaClient } from "../src/application/database"
import { redis } from "../src/application/redis"
import bcrypt from "bcrypt"

let accessToken: string

describe("Job Categories API", () => {

    beforeEach(async () => {
        // cleanup
        await prismaClient.jobCategories.deleteMany({})
        await prismaClient.user.deleteMany({
            where: { username: "testuser" }
        })

        // create user
        const hashed = await bcrypt.hash("Password123!", 10)
        await prismaClient.user.create({
            data: {
                username: "testuser",
                email: "test@example.com",
                password: hashed,
                firstName: "Test",
                birthDate: new Date("2000-01-01"),
                phone: "+628123456700",
                role: "USER",
                status: "ACTIVE"
            }
        })

        // login → get access token
        const loginRes = await supertest(server.webApp)
            .post("/public/api/auth/login")
            .send({
                usernameOrEmail: "testuser",
                password: "Password123!"
            })

        accessToken = loginRes.body.data.accessToken

        // seed job categories
        await prismaClient.jobCategories.createMany({
            data: [
                {
                    id: "jc1",
                    code: "HOME_REPAIR",
                    name: "Perbaikan Rumah",
                    isActive: true
                },
                {
                    id: "jc2",
                    code: "CLEANING",
                    name: "Kebersihan & Sanitasi",
                    isActive: true
                },
                {
                    id: "jc3",
                    code: "ELECTRONICS",
                    name: "Elektronik",
                    isActive: false
                }
            ]
        })
    })

    afterEach(async () => {
        await prismaClient.jobCategories.deleteMany({})
        await prismaClient.user.deleteMany({})
        await redis.flushdb()
    })

    afterAll(async () => {
        await prismaClient.$disconnect()
        await redis.quit()
    })

    // ===============================
    // GET ALL
    // ===============================
    describe("GET /api/jobCategories", () => {
        it("should return all active job categories", async () => {
            const res = await supertest(server.webApp)
                .get("/api/jobCategories")
                .set("Authorization", `Bearer ${accessToken}`)

            expect(res.status).toBe(200)
            expect(res.body.success).toBe(true)
            expect(res.body.data.length).toBe(2)

            expect(res.body.data[0]).toHaveProperty("id")
            expect(res.body.data[0]).toHaveProperty("code")
            expect(res.body.data[0]).toHaveProperty("name")
            expect(res.body.data[0]).toHaveProperty("isActive", true)
        })

        it("should reject request without token", async () => {
            const res = await supertest(server.webApp)
                .get("/api/jobCategories")

            expect(res.status).toBe(401)
            expect(res.body.success).toBe(false)
        })
    })

    // ===============================
    // GET BY ID
    // ===============================
    describe("GET /api/jobCategories/:jobCategoryId", () => {
        it("should return job category by id", async () => {
            const res = await supertest(server.webApp)
                .get("/api/jobCategories/jc1")
                .set("Authorization", `Bearer ${accessToken}`)

            expect(res.status).toBe(200)
            expect(res.body.success).toBe(true)
            expect(res.body.data).toEqual({
                id: "jc1",
                code: "HOME_REPAIR",
                name: "Perbaikan Rumah",
                isActive: true
            })
        })

        it("should return 404 if job category not found", async () => {
            const res = await supertest(server.webApp)
                .get("/api/jobCategories/not-exist")
                .set("Authorization", `Bearer ${accessToken}`)

            expect(res.status).toBe(404)
            expect(res.body.success).toBe(false)
        })

        it("should reject request without token", async () => {
            const res = await supertest(server.webApp)
                .get("/api/jobCategories/jc1")

            expect(res.status).toBe(401)
            expect(res.body.success).toBe(false)
        })
    })
})
