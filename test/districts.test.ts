import { describe, it, expect, beforeEach, afterEach, afterAll } from "@jest/globals"
import supertest from "supertest"
import * as server from "../src/application/server"
import { prismaClient } from "../src/application/database"
import { redis } from "../src/application/redis"
import bcrypt from "bcrypt"

let accessToken: string

describe("DISTRICTS API", () => {

  beforeEach(async () => {
    // cleanup (child dulu)
    await prismaClient.masterDistrict.deleteMany()
    await prismaClient.masterCity.deleteMany()
    await prismaClient.masterProvince.deleteMany()
    await prismaClient.user.deleteMany({
      where: { username: "districtuser" }
    })

    // seed user
    const hashed = await bcrypt.hash("Password123!", 10)
    await prismaClient.user.create({
      data: {
        username: "districtuser",
        email: "district@example.com",
        password: hashed,
        firstName: "District",
        birthDate: new Date("2000-01-01"),
        phone: "+628123456702",
        role: "USER",
        status: "ACTIVE"
      }
    })

    // login
    const loginRes = await supertest(server.webApp)
      .post("/public/api/auth/login")
      .send({
        usernameOrEmail: "districtuser",
        password: "Password123!"
      })

    accessToken = loginRes.body.data.accessToken

    // seed province
    await prismaClient.masterProvince.create({
      data: {
        id: "P11",
        code: "11",
        name: "Aceh"
      }
    })

    // seed city
    await prismaClient.masterCity.create({
      data: {
        id: "C1101",
        code: "11.01",
        name: "Kab. Aceh Selatan",
        provinceId: "P11",
        province: {
          id: "P11",
          code: "11",
          name: "Aceh"
        }
      }
    })

    // seed districts
    await prismaClient.masterDistrict.createMany({
      data: [
        {
          id: "D110101",
          code: "11.01.01",
          name: "Bakongan",
          cityId: "C1101",
          city: {
            id: "C1101",
            code: "11.01",
            name: "Kab. Aceh Selatan"
          },
          province: {
            id: "P11",
            code: "11",
            name: "Aceh"
          }
        },
        {
          id: "D110102",
          code: "11.01.02",
          name: "Kluet Utara",
          cityId: "C1101",
          city: {
            id: "C1101",
            code: "11.01",
            name: "Kab. Aceh Selatan"
          },
          province: {
            id: "P11",
            code: "11",
            name: "Aceh"
          }
        }
      ]
    })
  })

  afterEach(async () => {
    await prismaClient.masterDistrict.deleteMany()
    await prismaClient.masterCity.deleteMany()
    await prismaClient.masterProvince.deleteMany()
    await prismaClient.user.deleteMany({
      where: { username: "districtuser" }
    })
    await redis.flushdb()
  })

  afterAll(async () => {
    await prismaClient.$disconnect()
    await redis.quit()
  })

  // =============================
  // GET DISTRICT BY ID
  // =============================
  describe("GET /api/districts/:districtId", () => {

    it("should get district by id successfully", async () => {
      const res = await supertest(server.webApp)
        .get("/api/districts/D110101")
        .set("Authorization", `Bearer ${accessToken}`)

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)

      expect(res.body.data).toEqual({
        id: "D110101",
        code: "11.01.01",
        name: "Bakongan",
        province: {
          id: "P11",
          code: "11",
          name: "Aceh"
        },
        city: {
          id: "C1101",
          code: "11.01",
          name: "Kab. Aceh Selatan"
        }
      })
    })

    it("should return 404 if district not found", async () => {
      const res = await supertest(server.webApp)
        .get("/api/districts/D999999")
        .set("Authorization", `Bearer ${accessToken}`)

      expect(res.status).toBe(404)
      expect(res.body.success).toBe(false)
    })

    it("should reject request without token", async () => {
      const res = await supertest(server.webApp)
        .get("/api/districts/D110101")

      expect(res.status).toBe(401)
      expect(res.body.success).toBe(false)
    })
  })

  // =============================
  // GET DISTRICT BY CITY
  // =============================
  describe("GET /api/cities/:cityId/districts", () => {

    it("should get districts by city successfully", async () => {
      const res = await supertest(server.webApp)
        .get("/api/cities/C1101/districts")
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
        .get("/api/cities/C1101/districts")

      expect(res.status).toBe(401)
      expect(res.body.success).toBe(false)
    })
  })

  // =============================
  // GET ALL DISTRICTS
  // =============================
  describe("GET /api/districts", () => {

    it("should get all districts successfully", async () => {
      const res = await supertest(server.webApp)
        .get("/api/districts")
        .set("Authorization", `Bearer ${accessToken}`)

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.data.length).toBe(2)
    })

    it("should reject request without token", async () => {
      const res = await supertest(server.webApp)
        .get("/api/districts")

      expect(res.status).toBe(401)
      expect(res.body.success).toBe(false)
    })
  })
})
