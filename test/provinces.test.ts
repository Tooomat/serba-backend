import { describe, it, expect, beforeEach, afterEach, afterAll } from "@jest/globals"
import supertest from "supertest"
import * as server from "../src/application/server"
import { prismaClient } from "../src/application/database"
import { redis } from "../src/application/redis"
import bcrypt from "bcrypt"

let accessToken: string

describe("PROVINCES API", () => {

  beforeEach(async () => {
    // cleanup
    await prismaClient.masterProvince.deleteMany()
    await prismaClient.user.deleteMany({
      where: { username: "provinceuser" }
    })

    // seed user
    const hashed = await bcrypt.hash("Password123!", 10)
    const user = await prismaClient.user.create({
      data: {
        username: "provinceuser",
        email: "province@example.com",
        password: hashed,
        firstName: "Province",
        birthDate: new Date("2000-01-01"),
        phone: "+628123456700",
        role: "USER",
        status: "ACTIVE"
      }
    })

    // login → ambil accessToken
    const loginRes = await supertest(server.webApp)
      .post("/public/api/auth/login")
      .send({
        usernameOrEmail: "provinceuser",
        password: "Password123!"
      })

    accessToken = loginRes.body.data.accessToken

    // seed provinces (ID = P${code})
    await prismaClient.masterProvince.createMany({
      data: [
        { id: "P11", code: "11", name: "Aceh" },
        { id: "P32", code: "32", name: "Jawa Barat" }
      ]
    })
  })

  afterEach(async () => {
    await prismaClient.masterProvince.deleteMany()
    await prismaClient.user.deleteMany({
      where: { username: "provinceuser" }
    })
    await redis.flushdb()
  })

  afterAll(async () => {
    await prismaClient.$disconnect()
    await redis.quit()
  })

  // =============================
  // GET ALL PROVINCES
  // =============================
  describe("GET /api/provinces", () => {

    it("should get all provinces successfully", async () => {
      const res = await supertest(server.webApp)
        .get("/api/provinces")
        .set("Authorization", `Bearer ${accessToken}`)

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.data.length).toBe(2)

      expect(res.body.data[0]).toHaveProperty("id")
      expect(res.body.data[0]).toHaveProperty("code")
      expect(res.body.data[0]).toHaveProperty("name")
    })

    it("should reject request without token", async () => {
      const res = await supertest(server.webApp)
        .get("/api/provinces")

      expect(res.status).toBe(401)
      expect(res.body.success).toBe(false)
    })
  })

  // =============================
  // GET PROVINCE BY ID
  // =============================
  describe("GET /api/provinces/:provinceId", () => {

    it("should get province by id successfully", async () => {
      const res = await supertest(server.webApp)
        .get("/api/provinces/P11")
        .set("Authorization", `Bearer ${accessToken}`)

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)

      expect(res.body.data).toEqual({
        id: "P11",
        code: "11",
        name: "Aceh"
      })
    })

    it("should return 404 if province not found", async () => {
      const res = await supertest(server.webApp)
        .get("/api/provinces/P99")
        .set("Authorization", `Bearer ${accessToken}`)

      expect(res.status).toBe(404)
      expect(res.body.success).toBe(false)
    })

    it("should reject request without token", async () => {
      const res = await supertest(server.webApp)
        .get("/api/provinces/P11")

      expect(res.status).toBe(401)
      expect(res.body.success).toBe(false)
    })
  })
})
