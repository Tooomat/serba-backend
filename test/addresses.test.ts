import { describe, it, expect, beforeEach, afterEach, afterAll } from '@jest/globals'
import supertest from "supertest"
import * as server from "../src/application/server"
import { prismaClient } from "../src/application/database"
import { redis } from "../src/application/redis"
import bcrypt from "bcrypt"


describe("Address API Tests", () => {
    let accessToken: string
    let userId: string
    let subdistrictId: string

    beforeEach(async () => {
        // ===== CLEANUP (child dulu, parent belakangan) =====
        await prismaClient.address.deleteMany({})
        await prismaClient.masterSubdistrict.deleteMany({})
        await prismaClient.masterDistrict.deleteMany({})
        await prismaClient.masterCity.deleteMany({})
        await prismaClient.masterProvince.deleteMany({})
        await prismaClient.user.deleteMany({
            where: { username: 'addressuser' }
        })

        // ===== SEED USER =====
        const hashed = await bcrypt.hash("Password123!", 10)
        const user = await prismaClient.user.create({
            data: {
                username: "addressuser",
                email: "address@example.com",
                password: hashed,
                firstName: "Address",
                birthDate: new Date("2000-01-01"),
                phone: "+628123456790",
                role: "USER",
                status: "ACTIVE"
            }
        })
        userId = user.id

        // ===== LOGIN TO GET TOKEN =====
        const loginRes = await supertest(server.webApp)
            .post("/public/api/auth/login")
            .send({
                usernameOrEmail: "addressuser",
                password: "Password123!"
            })

        accessToken = loginRes.body.data.accessToken

        // ===== SEED MASTER DATA (province -> city -> district -> subdistrict) =====
        
        // Province
        await prismaClient.masterProvince.create({
            data: {
                id: "P35",
                code: "35",
                name: "Jawa Timur"
            }
        })

        // City
        await prismaClient.masterCity.create({
            data: {
                id: "C3578",
                code: "35.78",
                name: "Kota Surabaya",
                provinceId: "P35",
                province: {
                    id: "P35",
                    code: "35",
                    name: "Jawa Timur"
                }
            }
        })

        // District
        await prismaClient.masterDistrict.create({
            data: {
                id: "D357801",
                code: "35.78.01",
                name: "Tegalsari",
                cityId: "C3578",
                city: {
                    id: "C3578",
                    code: "35.78",
                    name: "Kota Surabaya"
                },
                province: {
                    id: "P35",
                    code: "35",
                    name: "Jawa Timur"
                }
            }
        })

        // Subdistrict
        const subdistrict = await prismaClient.masterSubdistrict.create({
            data: {
                id: "SD35780101",
                code: "35.78.01.1001",
                name: "Tegalsari",
                districtId: "D357801",
                district: {
                    id: "D357801",
                    code: "35.78.01",
                    name: "Tegalsari"
                },
                city: {
                    id: "C3578",
                    code: "35.78",
                    name: "Kota Surabaya"
                },
                province: {
                    id: "P35",
                    code: "35",
                    name: "Jawa Timur"
                }
            }
        })
        subdistrictId = subdistrict.id
    })

    afterEach(async () => {
        await prismaClient.address.deleteMany({})
        await prismaClient.masterSubdistrict.deleteMany({})
        await prismaClient.masterDistrict.deleteMany({})
        await prismaClient.masterCity.deleteMany({})
        await prismaClient.masterProvince.deleteMany({})
        await prismaClient.user.deleteMany({
            where: { username: 'addressuser' }
        })
        await redis.flushdb()
    })

    afterAll(async () => {
        await prismaClient.$disconnect()
        await redis.quit()
    })

    // ============================================
    // CREATE ADDRESS TESTS
    // ============================================
    describe("POST /api/addresses", () => {
        it("should create first address successfully (must be primary)", async () => {
            const res = await supertest(server.webApp)
                .post("/api/addresses")
                .set("Authorization", `Bearer ${accessToken}`)
                .send({
                    subdistrictId: subdistrictId,
                    street: "Jl. Merdeka No. 123",
                    postalCode: "60123",
                    benchmark: "Dekat Indomaret",
                    markAs: "Home",
                    isPrimary: true,
                    lat: "-7.2575",
                    lng: "112.7521"
                })

            expect(res.status).toBe(201)
            expect(res.body.success).toBe(true)
            expect(res.body.data.street).toBe("Jl. Merdeka No. 123")
            expect(res.body.data.isPrimary).toBe(true)
            expect(res.body.data.markAs).toBe("Home")
            expect(res.body.data.benchmark).toBe("Dekat Indomaret")
            expect(res.body.data.locations.subdistrict.name).toBe("Tegalsari")
        })

        it("should reject first address if not primary", async () => {
            const res = await supertest(server.webApp)
                .post("/api/addresses")
                .set("Authorization", `Bearer ${accessToken}`)
                .send({
                    subdistrictId: subdistrictId,
                    street: "Jl. Merdeka No. 123",
                    postalCode: "60123",
                    markAs: "Home",
                    isPrimary: false,
                    lat: "-7.2575",
                    lng: "112.7521"
                })

            expect(res.status).toBe(400)
            expect(res.body.success).toBe(false)
            expect(res.body.errors).toContain("First address must be primary")  // ✅ Ganti dari message ke errors
        })

        it("should create second address (non-primary)", async () => {
            // Create first address
            await supertest(server.webApp)
                .post("/api/addresses")
                .set("Authorization", `Bearer ${accessToken}`)
                .send({
                    subdistrictId: subdistrictId,
                    street: "Jl. Pertama",
                    postalCode: "60123",
                    markAs: "Home",
                    isPrimary: true,
                    lat: "-7.2575",
                    lng: "112.7521"
                })

            // Create second address
            const res = await supertest(server.webApp)
                .post("/api/addresses")
                .set("Authorization", `Bearer ${accessToken}`)
                .send({
                    subdistrictId: subdistrictId,
                    street: "Jl. Kedua",
                    postalCode: "60124",
                    markAs: "Office",
                    isPrimary: false,
                    lat: "-7.2576",
                    lng: "112.7522"
                })

            expect(res.status).toBe(201)
            expect(res.body.data.isPrimary).toBe(false)
            expect(res.body.data.markAs).toBe("Office")
        })

        it("should auto-unset old primary when creating new primary address", async () => {
            // Create first primary address
            const res1 = await supertest(server.webApp)
                .post("/api/addresses")
                .set("Authorization", `Bearer ${accessToken}`)
                .send({
                    subdistrictId: subdistrictId,
                    street: "Jl. Primary 1",
                    postalCode: "60123",
                    markAs: "Home",
                    isPrimary: true,
                    lat: "-7.2575",
                    lng: "112.7521"
                })

            const firstAddressId = res1.body.data.id

            // Create second primary address
            await supertest(server.webApp)
                .post("/api/addresses")
                .set("Authorization", `Bearer ${accessToken}`)
                .send({
                    subdistrictId: subdistrictId,
                    street: "Jl. Primary 2",
                    postalCode: "60124",
                    markAs: "Home",
                    isPrimary: true,
                    lat: "-7.2576",
                    lng: "112.7522"
                })

            // Check old primary is now non-primary
            const oldAddress = await prismaClient.address.findUnique({
                where: { id: firstAddressId }
            })
            expect(oldAddress?.isPrimary).toBe(false)
        })

        it("should reject if user already has 5 addresses", async () => {
            // Create 5 addresses
            for (let i = 0; i < 5; i++) {
                await supertest(server.webApp)
                    .post("/api/addresses")
                    .set("Authorization", `Bearer ${accessToken}`)
                    .send({
                        subdistrictId: subdistrictId,
                        street: `Jl. Address ${i + 1}`,
                        postalCode: "60123",
                        markAs: i === 0 ? "Home" : "Office",
                        isPrimary: i === 0,
                        lat: `-7.${2575 + i}`,
                        lng: `112.${7521 + i}`
                    })
            }

            // Try to create 6th address
            const res = await supertest(server.webApp)
                .post("/api/addresses")
                .set("Authorization", `Bearer ${accessToken}`)
                .send({
                    subdistrictId: subdistrictId,
                    street: "Jl. Address 6",
                    postalCode: "60123",
                    markAs: "home",
                    isPrimary: false,
                    lat: "-7.2580",
                    lng: "112.7526"
                })

            expect(res.status).toBe(400)
            expect(res.body.errors).toContain("maximum of 5 addresses")  // ✅ Ganti dari message ke errors
        })

        it("should reject with invalid subdistrict", async () => {
            const res = await supertest(server.webApp)
                .post("/api/addresses")
                .set("Authorization", `Bearer ${accessToken}`)
                .send({
                    subdistrictId: "invalid-id",
                    street: "Jl. Merdeka",
                    postalCode: "60123",
                    markAs: "Home",
                    isPrimary: true,
                    lat: "-7.2575",
                    lng: "112.7521"
                })

            expect(res.status).toBe(404)
            expect(res.body.errors).toContain("Sub district not found")  // ✅ Ganti dari message ke errors
        })

        it("should reject with invalid latitude", async () => {
            const res = await supertest(server.webApp)
                .post("/api/addresses")
                .set("Authorization", `Bearer ${accessToken}`)
                .send({
                    subdistrictId: subdistrictId,
                    street: "Jl. Merdeka",
                    postalCode: "60123",
                    markAs: "Home",
                    isPrimary: true,
                    lat: "100",  // > 90
                    lng: "112.7521"
                })

            expect(res.status).toBe(400)
            expect(res.body.success).toBe(false)
        })

        it("should reject with invalid postal code", async () => {
            const res = await supertest(server.webApp)
                .post("/api/addresses")
                .set("Authorization", `Bearer ${accessToken}`)
                .send({
                    subdistrictId: subdistrictId,
                    street: "Jl. Merdeka",
                    postalCode: "123",  // Not 5 digits
                    markAs: "Home",
                    isPrimary: true,
                    lat: "-7.2575",
                    lng: "112.7521"
                })

            expect(res.status).toBe(400)
            expect(res.body.success).toBe(false)
        })
    })

    // ============================================
    // GET ALL ADDRESSES TESTS
    // ============================================
    describe("GET /api/addresses", () => {
        it("should get all user addresses", async () => {
            // Create 2 addresses
            await supertest(server.webApp)
                .post("/api/addresses")
                .set("Authorization", `Bearer ${accessToken}`)
                .send({
                    subdistrictId: subdistrictId,
                    street: "Jl. Address 1",
                    postalCode: "60123",
                    markAs: "Home",
                    isPrimary: true,
                    lat: "-7.2575",
                    lng: "112.7521"
                })

            await supertest(server.webApp)
                .post("/api/addresses")
                .set("Authorization", `Bearer ${accessToken}`)
                .send({
                    subdistrictId: subdistrictId,
                    street: "Jl. Address 2",
                    postalCode: "60124",
                    markAs: "Office",
                    isPrimary: false,
                    lat: "-7.2576",
                    lng: "112.7522"
                })

            // Get all addresses
            const res = await supertest(server.webApp)
                .get("/api/addresses")
                .set("Authorization", `Bearer ${accessToken}`)

            expect(res.status).toBe(200)
            expect(res.body.success).toBe(true)
            expect(res.body.data).toHaveLength(2)
        })

        it("should return empty array if user has no addresses", async () => {
            const res = await supertest(server.webApp)
                .get("/api/addresses")
                .set("Authorization", `Bearer ${accessToken}`)

            expect(res.status).toBe(200)
            expect(res.body.data).toHaveLength(0)
        })
    })

    // ============================================
    // GET SINGLE ADDRESS TESTS
    // ============================================
    describe("GET /api/addresses/:addressId", () => {
        it("should get single address by id", async () => {
            // Create address
            const createRes = await supertest(server.webApp)
                .post("/api/addresses")
                .set("Authorization", `Bearer ${accessToken}`)
                .send({
                    subdistrictId: subdistrictId,
                    street: "Jl. Test",
                    postalCode: "60123",
                    markAs: "Home",
                    isPrimary: true,
                    lat: "-7.2575",
                    lng: "112.7521"
                })

            const addressId = createRes.body.data.id

            // Get address
            const res = await supertest(server.webApp)
                .get(`/api/addresses/${addressId}`)
                .set("Authorization", `Bearer ${accessToken}`)

            expect(res.status).toBe(200)
            expect(res.body.data.id).toBe(addressId)
            expect(res.body.data.street).toBe("Jl. Test")
        })

        it("should reject if address not found", async () => {
            const res = await supertest(server.webApp)
                .get("/api/addresses/invalid-id")
                .set("Authorization", `Bearer ${accessToken}`)

            expect(res.status).toBe(404)
            expect(res.body.success).toBe(false)
        })

        it("should reject if address belongs to another user", async () => {
            // Create another user
            const hashed = await bcrypt.hash("Password123!", 10)
            const otherUser = await prismaClient.user.create({
                data: { 
                    username: "otheruser",
                    email: "otheruser@example.com",
                    password: hashed,
                    firstName: "Other",
                    birthDate: new Date("2000-01-01"),
                    phone: "+628123456791",
                    role: "USER",
                    status: "ACTIVE"
                }
            })

            // Create address for other user
            const otherAddress = await prismaClient.address.create({
                data: {
                    userId: otherUser.id,
                    subdistrictId: subdistrictId,
                    street: "Jl. Other",
                    postalCode: "60123",
                    markAs: "HOME",
                    isPrimary: true,
                    lat: "-7.2575",
                    lng: "112.7521",
                    locations: {
                        subdistrict: {
                            id: "SD35780101",
                            code: "35.78.01.1001",
                            name: "Tegalsari"
                        },
                        district: {
                            id: "D357801",
                            code: "35.78.01",
                            name: "Tegalsari"
                        },
                        city: {
                            id: "C3578",
                            code: "35.78",
                            name: "Kota Surabaya"
                        },
                        province: {
                            id: "P35",
                            code: "35",
                            name: "Jawa Timur"
                        }
                    }
                }
            })

            // Try to get other user's address
            const res = await supertest(server.webApp)
                .get(`/api/addresses/${otherAddress.id}`)
                .set("Authorization", `Bearer ${accessToken}`)

            expect(res.status).toBe(404)
        })
    })

    // ============================================
    // UPDATE ADDRESS TESTS
    // ============================================
    describe("PATCH /api/addresses/:addressId", () => {
        it("should update address successfully", async () => {
            // Create address
            const createRes = await supertest(server.webApp)
                .post("/api/addresses")
                .set("Authorization", `Bearer ${accessToken}`)
                .send({
                    subdistrictId: subdistrictId,
                    street: "Jl. Old",
                    postalCode: "60123",
                    markAs: "Home",
                    isPrimary: true,
                    lat: "-7.2575",
                    lng: "112.7521"
                })

            const addressId = createRes.body.data.id

            // Update address
            const res = await supertest(server.webApp)
                .patch(`/api/addresses/${addressId}`)
                .set("Authorization", `Bearer ${accessToken}`)
                .send({
                    street: "Jl. New",
                    postalCode: "60999"
                })

            expect(res.status).toBe(200)
            expect(res.body.data.street).toBe("Jl. New")
            expect(res.body.data.postalCode).toBe("60999")
        })

        it("should update markAs from home to office", async () => {
            // Create address
            const createRes = await supertest(server.webApp)
                .post("/api/addresses")
                .set("Authorization", `Bearer ${accessToken}`)
                .send({
                    subdistrictId: subdistrictId,
                    street: "Jl. Test",
                    postalCode: "60123",
                    markAs: "Home",
                    isPrimary: true,
                    lat: "-7.2575",
                    lng: "112.7521"
                })

            const addressId = createRes.body.data.id

            // Update markAs
            const res = await supertest(server.webApp)
                .patch(`/api/addresses/${addressId}`)
                .set("Authorization", `Bearer ${accessToken}`)
                .send({
                    markAs: "Office"
                })

            expect(res.status).toBe(200)
            expect(res.body.data.markAs).toBe("Office")
        })

        it("should reject unsetting last primary address", async () => {
            // Create primary address
            const createRes = await supertest(server.webApp)
                .post("/api/addresses")
                .set("Authorization", `Bearer ${accessToken}`)
                .send({
                    subdistrictId: subdistrictId,
                    street: "Jl. Primary",
                    postalCode: "60123",
                    markAs: "Home",
                    isPrimary: true,
                    lat: "-7.2575",
                    lng: "112.7521"
                })

            const addressId = createRes.body.data.id

            // Try to unset primary
            const res = await supertest(server.webApp)
                .patch(`/api/addresses/${addressId}`)
                .set("Authorization", `Bearer ${accessToken}`)
                .send({
                    isPrimary: false
                })

            expect(res.status).toBe(400)
            expect(res.body.errors).toContain("At least one primary address")  // ✅ Ganti dari message ke errors
        })


        it("should allow unsetting primary if user has other primary addresses", async () => {
            // Create first primary
            const res1 = await supertest(server.webApp)
                .post("/api/addresses")
                .set("Authorization", `Bearer ${accessToken}`)
                .send({
                    subdistrictId: subdistrictId,
                    street: "Jl. Primary 1",
                    postalCode: "60123",
                    markAs: "Home",
                    isPrimary: true,
                    lat: "-7.2575",
                    lng: "112.7521"
                })

            const address1Id = res1.body.data.id

            // Create second primary
            await supertest(server.webApp)
                .post("/api/addresses")
                .set("Authorization", `Bearer ${accessToken}`)
                .send({
                    subdistrictId: subdistrictId,
                    street: "Jl. Primary 2",
                    postalCode: "60124",
                    markAs: "Office",
                    isPrimary: true,
                    lat: "-7.2576",
                    lng: "112.7522"
                })

            // Unset first primary (should succeed)
            const res = await supertest(server.webApp)
                .patch(`/api/addresses/${address1Id}`)
                .set("Authorization", `Bearer ${accessToken}`)
                .send({
                    isPrimary: false
                })

            expect(res.status).toBe(200)
            expect(res.body.data.isPrimary).toBe(false)
        })
    })

    // ============================================
    // DELETE ADDRESS TESTS
    // ============================================
    describe("DELETE /api/addresses/:addressId", () => {
        it("should delete non-primary address", async () => {
            // Create 2 addresses
            await supertest(server.webApp)
                .post("/api/addresses")
                .set("Authorization", `Bearer ${accessToken}`)
                .send({
                    subdistrictId: subdistrictId,
                    street: "Jl. Primary",
                    postalCode: "60123",
                    markAs: "Home",
                    isPrimary: true,
                    lat: "-7.2575",
                    lng: "112.7521"
                })

            const res2 = await supertest(server.webApp)
                .post("/api/addresses")
                .set("Authorization", `Bearer ${accessToken}`)
                .send({
                    subdistrictId: subdistrictId,
                    street: "Jl. Non-Primary",
                    postalCode: "60124",
                    markAs: "Office",
                    isPrimary: false,
                    lat: "-7.2576",
                    lng: "112.7522"
                })

            const address2Id = res2.body.data.id

            // Delete non-primary
            const res = await supertest(server.webApp)
                .delete(`/api/addresses/${address2Id}`)
                .set("Authorization", `Bearer ${accessToken}`)

            expect(res.status).toBe(200)

            // Verify deleted
            const check = await prismaClient.address.findUnique({
                where: { id: address2Id }
            })
            expect(check).toBeNull()
        })

        it("should delete primary and auto-promote another address", async () => {
            // Create 2 addresses
            const res1 = await supertest(server.webApp)
                .post("/api/addresses")
                .set("Authorization", `Bearer ${accessToken}`)
                .send({
                    subdistrictId: subdistrictId,
                    street: "Jl. Primary",
                    postalCode: "60123",
                    markAs: "Home",
                    isPrimary: true,
                    lat: "-7.2575",
                    lng: "112.7521"
                })

            const primaryId = res1.body.data.id

            const res2 = await supertest(server.webApp)
                .post("/api/addresses")
                .set("Authorization", `Bearer ${accessToken}`)
                .send({
                    subdistrictId: subdistrictId,
                    street: "Jl. Non-Primary",
                    postalCode: "60124",
                    markAs: "Office",
                    isPrimary: false,
                    lat: "-7.2576",
                    lng: "112.7522"
                })

            const nonPrimaryId = res2.body.data.id

            // Delete primary
            const res = await supertest(server.webApp)
                .delete(`/api/addresses/${primaryId}`)
                .set("Authorization", `Bearer ${accessToken}`)

            expect(res.status).toBe(200)

            // Check that non-primary is now primary
            const promoted = await prismaClient.address.findUnique({
                where: { id: nonPrimaryId }
            })
            expect(promoted?.isPrimary).toBe(true)
        })

        it("should allow deleting last address", async () => {
            // Create address
            const createRes = await supertest(server.webApp)
                .post("/api/addresses")
                .set("Authorization", `Bearer ${accessToken}`)
                .send({
                    subdistrictId: subdistrictId,
                    street: "Jl. Only",
                    postalCode: "60123",
                    markAs: "Home",
                    isPrimary: true,
                    lat: "-7.2575",
                    lng: "112.7521"
                })

            const addressId = createRes.body.data.id

            // Delete it
            const res = await supertest(server.webApp)
                .delete(`/api/addresses/${addressId}`)
                .set("Authorization", `Bearer ${accessToken}`)

            expect(res.status).toBe(200)

            // Verify user has 0 addresses
            const count = await prismaClient.address.count({
                where: { userId: userId }
            })
            expect(count).toBe(0)
        })

        it("should reject deleting non-existent address", async () => {
            const res = await supertest(server.webApp)
                .delete("/api/addresses/invalid-id")
                .set("Authorization", `Bearer ${accessToken}`)

            expect(res.status).toBe(404)
        })
    })

    // ============================================
    // AUTHORIZATION TESTS
    // ============================================
    describe("Authorization", () => {
        it("should reject requests without token", async () => {
            const res = await supertest(server.webApp)
                .get("/api/addresses")

            expect(res.status).toBe(401)
        })

        it("should reject requests with invalid token", async () => {
            const res = await supertest(server.webApp)
                .get("/api/addresses")
                .set("Authorization", "Bearer invalid-token")

            expect(res.status).toBe(401)
        })
    })
})