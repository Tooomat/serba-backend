import { describe, it, expect, beforeEach, afterEach, afterAll } from "@jest/globals"
import supertest from "supertest"
import * as server from "../src/application/server"
import { prismaClient } from "../src/application/database"
import { redis } from "../src/application/redis"
import bcrypt from "bcrypt"

let accessToken: string

describe("SUB DISTRICTS API", () => {

  beforeEach(async () => {
    // cleanup (child dulu)
    await prismaClient.masterSubdistrict.deleteMany()
    await prismaClient.masterDistrict.deleteMany()
    await prismaClient.masterCity.deleteMany()
    await prismaClient.masterProvince.deleteMany()
    await prismaClient.user.deleteMany({
      where: { username: "subdistrictuser" }
    })

    // seed user
    const hashed = await bcrypt.hash("Password123!", 10)
    await prismaClient.user.create({
      data: {
        username: "subdistrictuser",
        email: "subdistrict@example.com",
        password: hashed,
        firstName: "Sub",
        birthDate: new Date("2000-01-01"),
        phone: "+628123456703",
        role: "USER",
        status: "ACTIVE"
      }
    })

    // login
    const loginRes = await supertest(server.webApp)
      .post("/public/api/auth/login")
      .send({
        usernameOrEmail: "subdistrictuser",
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

    // seed district
    await prismaClient.masterDistrict.create({
      data: {
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
      }
    })

    // seed sub districts
    await prismaClient.masterSubdistrict.createMany({
      data: [
        {
          id: "SD11010101",
          code: "11.01.01.2001",
          name: "Keude Bakongan",
          districtId: "D110101",
          district: {
            id: "D110101",
            code: "11.01.01",
            name: "Bakongan"
          },
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
          id: "SD11010102",
          code: "11.01.01.2002",
          name: "Ujong Mangki",
          districtId: "D110101",
          district: {
            id: "D110101",
            code: "11.01.01",
            name: "Bakongan"
          },
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
    await prismaClient.masterSubdistrict.deleteMany()
    await prismaClient.masterDistrict.deleteMany()
    await prismaClient.masterCity.deleteMany()
    await prismaClient.masterProvince.deleteMany()
    await prismaClient.user.deleteMany({
      where: { username: "subdistrictuser" }
    })
    await redis.flushdb()
  })

  afterAll(async () => {
    await prismaClient.$disconnect()
    await redis.quit()
  })

  // =============================
  // GET SUB DISTRICT BY ID
  // =============================
  describe("GET /api/subDistricts/:subDistrictId", () => {

    it("should get sub district by id successfully", async () => {
      const res = await supertest(server.webApp)
        .get("/api/subDistricts/SD11010101")
        .set("Authorization", `Bearer ${accessToken}`)

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)

      expect(res.body.data).toEqual({
            id: "SD11010101",
            code: "11.01.01.2001",
            name: "Keude Bakongan",
            province: {
                id: "P11",
                code: "11",
                name: "Aceh"
            },
            city: {
                id: "C1101",
                code: "11.01",
                name: "Kab. Aceh Selatan"
            },
            district: {
                id: "D110101",
                code: "11.01.01",
                name: "Bakongan"
            }   
        })

    })

    it("should return 404 if sub district not found", async () => {
      const res = await supertest(server.webApp)
        .get("/api/subDistricts/SD999999")
        .set("Authorization", `Bearer ${accessToken}`)

      expect(res.status).toBe(404)
      expect(res.body.success).toBe(false)
    })

    it("should reject request without token", async () => {
      const res = await supertest(server.webApp)
        .get("/api/subDistricts/SD11010101")

      expect(res.status).toBe(401)
      expect(res.body.success).toBe(false)
    })
  })

  // =============================
  // GET SUB DISTRICT BY DISTRICT
  // =============================
  describe("GET /api/districts/:districtId/subDistricts", () => {

    it("should get sub districts by district successfully", async () => {
      const res = await supertest(server.webApp)
        .get("/api/districts/D110101/subDistricts")
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
        .get("/api/districts/D110101/subDistricts")

      expect(res.status).toBe(401)
      expect(res.body.success).toBe(false)
    })
  })

  // =============================
  // GET ALL SUB DISTRICTS
  // =============================
  describe("GET /api/subDistricts", () => {

    it("should get all sub districts successfully", async () => {
      const res = await supertest(server.webApp)
        .get("/api/subDistricts")
        .set("Authorization", `Bearer ${accessToken}`)

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.data.length).toBe(2)
    })

    it("should reject request without token", async () => {
      const res = await supertest(server.webApp)
        .get("/api/subDistricts")

      expect(res.status).toBe(401)
      expect(res.body.success).toBe(false)
    })
  })
})
