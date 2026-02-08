import { describe, it, expect, beforeEach, afterEach, afterAll } from "@jest/globals"
import supertest from "supertest"
import * as server from "../src/application/server"
import { prismaClient } from "../src/application/database"
import { redis } from "../src/application/redis"
import bcrypt from "bcrypt"

let accessToken: string

describe("CITIES API", () => {

  beforeEach(async () => {
    // cleanup (child dulu baru parent)
    await prismaClient.masterCity.deleteMany()
    await prismaClient.masterProvince.deleteMany()
    await prismaClient.user.deleteMany({
      where: { username: "cityuser" }
    })

    // seed user
    const hashed = await bcrypt.hash("Password123!", 10)
    await prismaClient.user.create({
      data: {
        username: "cityuser",
        email: "city@example.com",
        password: hashed,
        firstName: "City",
        birthDate: new Date("2000-01-01"),
        phone: "+628123456701",
        role: "USER",
        status: "ACTIVE"
      }
    })

    // login
    const loginRes = await supertest(server.webApp)
      .post("/public/api/auth/login")
      .send({
        usernameOrEmail: "cityuser",
        password: "Password123!"
      })

    accessToken = loginRes.body.data.accessToken

    // seed province (ID = P${code})
    await prismaClient.masterProvince.create({
      data: {
        id: "P11",
        code: "11",
        name: "Aceh"
      }
    })

    // seed cities
    await prismaClient.masterCity.createMany({
        data: [
            {
                id: "C1101",
                code: "11.01",
                name: "Kab. Aceh Selatan",
                provinceId: "P11",
                province: {
                  id: "P11",
                  code: "11",
                  name: "Aceh"
                }
            },
            {
                id: "C1102",
                code: "11.02",
                name: "Kab. Aceh Tenggara",
                provinceId: "P11",
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
    await prismaClient.masterCity.deleteMany()
    await prismaClient.masterProvince.deleteMany()
    await prismaClient.user.deleteMany({
      where: { username: "cityuser" }
    })
    await redis.flushdb()
  })

  afterAll(async () => {
    await prismaClient.$disconnect()
    await redis.quit()
  })

  // =============================
  // GET CITY BY ID
  // =============================
  describe("GET /api/cities/:cityId", () => {

    it("should get city by id successfully", async () => {
      const res = await supertest(server.webApp)
        .get("/api/cities/C1101")
        .set("Authorization", `Bearer ${accessToken}`)

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)

      expect(res.body.data).toEqual({
        id: "C1101",
        code: "11.01",
        name: "Kab. Aceh Selatan",
        province: {
          id: "P11",
          code: "11",
          name: "Aceh"
        }
      })
    })

    it("should return 404 if city not found", async () => {
      const res = await supertest(server.webApp)
        .get("/api/cities/C9999")
        .set("Authorization", `Bearer ${accessToken}`)

      expect(res.status).toBe(404)
      expect(res.body.success).toBe(false)
    })

    it("should reject request without token", async () => {
      const res = await supertest(server.webApp)
        .get("/api/cities/C1101")

      expect(res.status).toBe(401)
      expect(res.body.success).toBe(false)
    })
  })

  // =============================
  // GET CITY BY PROVINCE
  // =============================
  describe("GET /api/provinces/:provinceId/cities", () => {

    it("should get cities by province successfully", async () => {
      const res = await supertest(server.webApp)
        .get("/api/provinces/P11/cities")
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
        .get("/api/provinces/P11/cities")

      expect(res.status).toBe(401)
      expect(res.body.success).toBe(false)
    })
  })

  // =============================
  // GET ALL CITIES
  // =============================
  describe("GET /api/cities", () => {

    it("should get all cities successfully", async () => {
      const res = await supertest(server.webApp)
        .get("/api/cities")
        .set("Authorization", `Bearer ${accessToken}`)

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.data.length).toBe(2)
    })

    it("should reject request without token", async () => {
      const res = await supertest(server.webApp)
        .get("/api/cities")

      expect(res.status).toBe(401)
      expect(res.body.success).toBe(false)
    })
  })
})
