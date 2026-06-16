import { describe, it, expect, beforeEach, afterEach, afterAll } from '@jest/globals'
import supertest from "supertest"
import * as server from "../src/application/server"
import { prismaClient } from "../src/application/database"
import { redis } from "../src/application/redis"
import bcrypt from "bcrypt"

describe("Jobs API Tests", () => {
    let accessToken: string
    let userId: string
    let addressId: string
    let categoryId1: string
    let categoryId2: string
    let subdistrictId: string

    beforeEach(async () => {
        // ===== CLEANUP =====
        await prismaClient.jobApplication.deleteMany({})
        await prismaClient.categoriesMapping.deleteMany({})
        await prismaClient.job.deleteMany({})

        await prismaClient.address.deleteMany({})
        await prismaClient.masterSubdistrict.deleteMany({})
        await prismaClient.masterDistrict.deleteMany({})
        await prismaClient.masterCity.deleteMany({})
        await prismaClient.masterProvince.deleteMany({})
        await prismaClient.user.deleteMany({
            where: { username: 'jobuser' }
        })

        // ===== SEED USER =====
        const hashed = await bcrypt.hash("Password123!", 10)
        const user = await prismaClient.user.create({
            data: {
                username: "jobuser",
                email: "job@example.com",
                password: hashed,
                firstName: "Job",
                lastName: "User",
                birthDate: new Date("2000-01-01"),
                phone: "+628123456799",
                role: "USER",
                status: "ACTIVE"
            }
        })
        userId = user.id

        // ===== LOGIN =====
        const loginRes = await supertest(server.webApp)
            .post("/public/api/auth/login")
            .send({
                usernameOrEmail: "jobuser",
                password: "Password123!"
            })
        accessToken = loginRes.body.data.accessToken

        // ===== SEED DUMMY MASTER LOCATIONS =====
        const province = await prismaClient.masterProvince.create({
            data: {
                id: "P35",
                code: "35",
                name: "Jawa Timur"
            }
        })

        const city = await prismaClient.masterCity.create({
            data: {
                id: "C3578",
                code: "35.78",
                name: "Kota Surabaya",
                provinceId: province.id,
                province: {
                    id: province.id,
                    code: province.code,
                    name: province.name
                }
            }
        })

        const district = await prismaClient.masterDistrict.create({
            data: {
                id: "D357801",
                code: "35.78.01",
                name: "Tegalsari",
                cityId: city.id,
                city: {
                    id: city.id,
                    code: city.code,
                    name: city.name
                },
                province: {
                    id: province.id,
                    code: province.code,
                    name: province.name
                }
            }
        })

        const subdistrict = await prismaClient.masterSubdistrict.create({
            data: {
                id: "SD35780101",
                code: "35.78.01.1001",
                name: "Tegalsari",
                districtId: district.id,
                district: {
                    id: district.id,
                    code: district.code,
                    name: district.name
                },
                city: {
                    id: city.id,
                    code: city.code,
                    name: city.name
                },
                province: {
                    id: province.id,
                    code: province.code,
                    name: province.name
                }
            }
        })
        subdistrictId = subdistrict.id

        // ===== SEED ADDRESS =====
        const address = await prismaClient.address.create({
            data: {
                userId: userId,
                subdistrictId: subdistrict.id,
                street: "Jl. Test No. 123",
                postalCode: "60123",
                markAs: "HOME",
                isPrimary: true,
                lat: "-7.2575",
                lng: "112.7521",
                locations: {
                    subdistrict: {
                        id: subdistrict.id,
                        code: subdistrict.code,
                        name: subdistrict.name
                    },
                    district: {
                        id: district.id,
                        code: district.code,
                        name: district.name
                    },
                    city: {
                        id: city.id,
                        code: city.code,
                        name: city.name
                    },
                    province: {
                        id: province.id,
                        code: province.code,
                        name: province.name
                    }
                }
            }
        })
        addressId = address.id

        // AMBIL JOB CATEGORIES YANG SUDAH DI-SEED
        const categories = await prismaClient.jobCategory.findMany({
            take: 2,
            orderBy: { createdAt: 'asc' }
        })

        if (categories.length < 2) {
            throw new Error("Job categories not seeded. Please run: npm run seed")
        }

        categoryId1 = categories[0].id
        categoryId2 = categories[1].id
    })

    afterEach(async () => {
        await prismaClient.jobApplication.deleteMany({})
        await prismaClient.categoriesMapping.deleteMany({})
        await prismaClient.job.deleteMany({})

        await prismaClient.address.deleteMany({})
        await prismaClient.masterSubdistrict.deleteMany({})
        await prismaClient.masterDistrict.deleteMany({})
        await prismaClient.masterCity.deleteMany({})
        await prismaClient.masterProvince.deleteMany({})
        await prismaClient.user.deleteMany({
            where: { username: 'jobuser' }
        })
        await redis.flushdb()
    })

    afterAll(async () => {
        await prismaClient.$disconnect()
        await redis.quit()
    })

    // ============================================
    // CREATE JOB TESTS
    // ============================================
    describe("POST /api/jobs", () => {
        it("should create job successfully with all fields", async () => {
            const tomorrow = new Date()
            tomorrow.setDate(tomorrow.getDate() + 1)
            const futureDate = tomorrow.toISOString().split('T')[0]

            const res = await supertest(server.webApp)
                .post("/api/jobs")
                .set("Authorization", `Bearer ${accessToken}`)
                .send({
                    addressId: addressId,
                    jobCategoriesId: [categoryId1, categoryId2],
                    title: "Full Stack Developer",
                    introduction: "Looking for experienced developer",
                    description: "We need a full stack developer with 3+ years experience",
                    level: ["intermediate", "expert"],
                    type: "urgent",
                    required: 2,
                    jobSite: "remote",
                    budgetMin: 5000000,
                    budgetMax: 8000000,
                    budgetType: "fixed",
                    status: "open",
                    startTime: "09:00",
                    endTime: "17:00",
                    startDate: futureDate,
                    endDate: futureDate
                })

            expect(res.status).toBe(201)
            expect(res.body.success).toBe(true)
            expect(res.body.data.title).toBe("Full Stack Developer")
            expect(res.body.data.type).toBe("Urgent")
            expect(res.body.data.jobSite).toBe("Remote")
            expect(res.body.data.level).toContain("Intermediate")
            expect(res.body.data.level).toContain("Expert")
            expect(res.body.data.budgetMin).toBeGreaterThan(5000000) // With urgent fee
        })

        it("should accept case-insensitive enum values", async () => {
            const res = await supertest(server.webApp)
                .post("/api/jobs")
                .set("Authorization", `Bearer ${accessToken}`)
                .send({
                    addressId: addressId,
                    jobCategoriesId: [categoryId1],
                    title: "Web Developer",
                    description: "Need web developer",
                    level: ["BEGINNER"],  // Uppercase
                    type: "URGENT",       // Uppercase
                    required: 1,
                    jobSite: "ON SITE",   // Uppercase dengan spasi
                    status: "Open"        // Mixed case
                })

            expect(res.status).toBe(201)
            expect(res.body.data.type).toBe("Urgent")
            expect(res.body.data.jobSite).toBe("On Site")
            expect(res.body.data.status).toBe("Open")
        })

        it("should create job with minimum required fields", async () => {
            const res = await supertest(server.webApp)
                .post("/api/jobs")
                .set("Authorization", `Bearer ${accessToken}`)
                .send({
                    addressId: addressId,
                    jobCategoriesId: [categoryId1],
                    title: "Web Developer",
                    description: "Need web developer",
                    level: ["beginner"],
                    type: "non urgent",
                    required: 1,
                    jobSite: "on site",
                    status: "open"
                })

            expect(res.status).toBe(201)
            expect(res.body.data.title).toBe("Web Developer")
            expect(res.body.data.type).toBe("Non Urgent")
            expect(res.body.data.budgetMin).toBeNull()
            expect(res.body.data.budgetMax).toBeNull()
        })

        it("should reject with invalid addressId", async () => {
            const res = await supertest(server.webApp)
                .post("/api/jobs")
                .set("Authorization", `Bearer ${accessToken}`)
                .send({
                    addressId: "invalid-address-id",
                    jobCategoriesId: [categoryId1],
                    title: "Developer",
                    description: "Need developer",
                    level: ["beginner"],
                    type: "urgent",
                    required: 1,
                    jobSite: "remote",
                    status: "open"
                })

            expect(res.status).toBe(404)
            expect(res.body.errors).toContain("Address not found")
        })

        it("should reject with invalid categoryId", async () => {
            const res = await supertest(server.webApp)
                .post("/api/jobs")
                .set("Authorization", `Bearer ${accessToken}`)
                .send({
                    addressId: addressId,
                    jobCategoriesId: ["invalid-category-id"],
                    title: "Developer",
                    description: "Need developer",
                    level: ["beginner"],
                    type: "urgent",
                    required: 1,
                    jobSite: "remote",
                    status: "open"
                })

            expect(res.status).toBe(404)
            expect(res.body.errors).toContain("job categories not found")
        })

        it("should reject with more than 2 categories", async () => {
            const categories = await prismaClient.jobCategory.findMany({
                take: 3
            })

            const res = await supertest(server.webApp)
                .post("/api/jobs")
                .set("Authorization", `Bearer ${accessToken}`)
                .send({
                    addressId: addressId,
                    jobCategoriesId: [categories[0].id, categories[1].id, categories[2].id],
                    title: "Developer",
                    description: "Need developer",
                    level: ["beginner"],
                    type: "urgent",
                    required: 1,
                    jobSite: "remote",
                    status: "open"
                })

            expect(res.status).toBe(400)
            expect(res.body.errors).toBeDefined()
        })

        it("should reject if budgetMax < budgetMin", async () => {
            const res = await supertest(server.webApp)
                .post("/api/jobs")
                .set("Authorization", `Bearer ${accessToken}`)
                .send({
                    addressId: addressId,
                    jobCategoriesId: [categoryId1],
                    title: "Developer",
                    description: "Need developer",
                    level: ["beginner"],
                    type: "urgent",
                    required: 1,
                    jobSite: "remote",
                    budgetMin: 8000000,
                    budgetMax: 5000000,
                    budgetType: "fixed",
                    status: "open"
                })

            expect(res.status).toBe(400)
            expect(res.body.errors).toBeDefined()
        })

        it("should reject if endTime <= startTime", async () => {
            const res = await supertest(server.webApp)
                .post("/api/jobs")
                .set("Authorization", `Bearer ${accessToken}`)
                .send({
                    addressId: addressId,
                    jobCategoriesId: [categoryId1],
                    title: "Developer",
                    description: "Need developer",
                    level: ["beginner"],
                    type: "urgent",
                    required: 1,
                    jobSite: "remote",
                    startTime: "17:00",
                    endTime: "09:00",
                    status: "open"
                })

            expect(res.status).toBe(400)
            expect(res.body.errors).toBeDefined()
        })

        it("should reject if startDate is in the past", async () => {
            const res = await supertest(server.webApp)
                .post("/api/jobs")
                .set("Authorization", `Bearer ${accessToken}`)
                .send({
                    addressId: addressId,
                    jobCategoriesId: [categoryId1],
                    title: "Developer",
                    description: "Need developer",
                    level: ["beginner"],
                    type: "urgent",
                    required: 1,
                    jobSite: "remote",
                    startDate: "2020-01-01",
                    status: "open"
                })

            expect(res.status).toBe(400)
            expect(res.body.errors).toBeDefined()
        })

        it("should reject without budgetType when budget provided", async () => {
            const res = await supertest(server.webApp)
                .post("/api/jobs")
                .set("Authorization", `Bearer ${accessToken}`)
                .send({
                    addressId: addressId,
                    jobCategoriesId: [categoryId1],
                    title: "Developer",
                    description: "Need developer",
                    level: ["beginner"],
                    type: "urgent",
                    required: 1,
                    jobSite: "remote",
                    budgetMin: 5000000,
                    budgetMax: 8000000,
                    status: "open"
                })

            expect(res.status).toBe(400)
            expect(res.body.errors[0].message).toContain("budgetType required when budget is provided")
        })
    })

    // ============================================
    // LIST PUBLIC JOBS TESTS
    // ============================================
    describe("GET /public/api/jobs", () => {
        beforeEach(async () => {
            // Create 3 public jobs for testing
            for (let i = 1; i <= 3; i++) {
                // Create job WITHOUT jobCategoriesId (not in Job table)
                const job = await prismaClient.job.create({
                    data: {
                        jobProviderId: userId,
                        addressId: addressId,
                        title: `Public Job ${i}`,
                        description: "Public job description",
                        level: ["BEGINNER"],
                        type: "URGENT",
                        required: 1,
                        jobSite: "REMOTE",
                        status: "OPEN",
                        isPublic: true,
                        locations: {
                            lat: -7.2575,
                            lng: 112.7521,
                            street: "Jl. Test",
                            masterLocations: {
                                subdistrict: { id: subdistrictId, code: "35.78.01.1001", name: "Tegalsari" },
                                district: { id: "D357801", code: "35.78.01", name: "Tegalsari" },
                                city: { id: "C3578", code: "35.78", name: "Kota Surabaya" },
                                province: { id: "P35", code: "35", name: "Jawa Timur" }
                            }
                        }
                    }
                })

                // Create mapping separately
                await prismaClient.categoriesMapping.create({
                    data: {
                        jobId: job.id,
                        jobCategoryId: categoryId1
                    }
                })
            }
        })

        it("should get public jobs successfully", async () => {
            const res = await supertest(server.webApp)
                .get("/public/api/jobs")

            expect(res.status).toBe(200)
            expect(res.body.success).toBe(true)
            expect(res.body.data.data).toBeDefined()
            expect(res.body.data.data.length).toBeGreaterThan(0)
            expect(res.body.data.paging).toBeDefined()
            expect(res.body.data.paging.currentPage).toBe(1)
        })

        it("should support pagination", async () => {
            const res = await supertest(server.webApp)
                .get("/public/api/jobs?page=1&size=2")

            expect(res.status).toBe(200)
            expect(res.body.data.paging.currentPage).toBe(1)
            expect(res.body.data.paging.size).toBe(2)
            expect(res.body.data.data.length).toBeLessThanOrEqual(2)
        })

        it("should have primaryImage in response", async () => {
            const res = await supertest(server.webApp)
                .get("/public/api/jobs")

            expect(res.status).toBe(200)
            if (res.body.data.data.length > 0) {
                expect(res.body.data.data[0].primaryImage).toBeDefined()
                expect(res.body.data.data[0].primaryImage).toContain("public/assets/images")
            }
        })
    })

    // ============================================
    // GET JOB DETAIL TESTS
    // ============================================
    describe("GET /api/jobs/:jobId", () => {
        it("should get job detail successfully as provider", async () => {
            // Create job
            const createRes = await supertest(server.webApp)
                .post("/api/jobs")
                .set("Authorization", `Bearer ${accessToken}`)
                .send({
                    addressId: addressId,
                    jobCategoriesId: [categoryId1],
                    title: "Test Job",
                    description: "Test description",
                    level: ["beginner"],
                    type: "urgent",
                    required: 1,
                    jobSite: "remote",
                    status: "open"
                })

            const jobId = createRes.body.data.id

            // Get job
            const res = await supertest(server.webApp)
                .get(`/api/jobs/${jobId}`)
                .set("Authorization", `Bearer ${accessToken}`)

            expect(res.status).toBe(200)
            expect(res.body.data.id).toBe(jobId)
            expect(res.body.data.title).toBe("Test Job")
            expect(res.body.data.isProvider).toBe(true)
            expect(res.body.data.user.jobProvider.name).toBe("Job User")
        })

        it("should reject if job not found", async () => {
            const res = await supertest(server.webApp)
                .get("/api/jobs/invalid-job-id")
                .set("Authorization", `Bearer ${accessToken}`)

            expect(res.status).toBe(404)
            expect(res.body.errors).toContain("Job not found")
        })
    })

    // ============================================
    // SEARCH JOBS TESTS
    // ============================================
    describe("GET /api/jobs/search", () => {
        beforeEach(async () => {
            // Create test jobs
            const job1 = await prismaClient.job.create({
                data: {
                    jobProviderId: userId,
                    addressId: addressId,
                    title: "Frontend Developer",
                    description: "React developer needed",
                    level: ["BEGINNER", "INTERMEDIATE"],
                    type: "URGENT",
                    required: 1,
                    jobSite: "REMOTE",
                    status: "OPEN",
                    isPublic: true,
                    locations: {
                        lat: -7.2575,
                        lng: 112.7521,
                        street: "Jl. Test",
                        masterLocations: {
                            subdistrict: { id: subdistrictId, code: "35.78.01.1001", name: "Tegalsari" },
                            district: { id: "D357801", code: "35.78.01", name: "Tegalsari" },
                            city: { id: "C3578", code: "35.78", name: "Kota Surabaya" },
                            province: { id: "P35", code: "35", name: "Jawa Timur" }
                        }
                    }
                }
            })

            await prismaClient.categoriesMapping.create({
                data: { jobId: job1.id, jobCategoryId: categoryId1 }
            })

            const job2 = await prismaClient.job.create({
                data: {
                    jobProviderId: userId,
                    addressId: addressId,
                    title: "Backend Developer",
                    description: "Node.js developer needed",
                    level: ["EXPERT"],
                    type: "NON_URGENT",
                    required: 2,
                    jobSite: "ON_SITE",
                    status: "OPEN",
                    isPublic: true,
                    locations: {
                        lat: -7.2575,
                        lng: 112.7521,
                        street: "Jl. Test",
                        masterLocations: {
                            subdistrict: { id: subdistrictId, code: "35.78.01.1001", name: "Tegalsari" },
                            district: { id: "D357801", code: "35.78.01", name: "Tegalsari" },
                            city: { id: "C3578", code: "35.78", name: "Kota Surabaya" },
                            province: { id: "P35", code: "35", name: "Jawa Timur" }
                        }
                    }
                }
            })

            await prismaClient.categoriesMapping.create({
                data: { jobId: job2.id, jobCategoryId: categoryId2 }
            })
        })

        it("should search jobs by title", async () => {
            const res = await supertest(server.webApp)
                .get("/api/jobs/search?title=Frontend")
                .set("Authorization", `Bearer ${accessToken}`)

            expect(res.status).toBe(200)
            expect(res.body.data.data.length).toBeGreaterThan(0)
        })

        it("should search jobs by category", async () => {
            const res = await supertest(server.webApp)
                .get(`/api/jobs/search?jobCategoriesId=${categoryId1}`)
                .set("Authorization", `Bearer ${accessToken}`)

            expect(res.status).toBe(200)
            expect(res.body.data.data.length).toBeGreaterThan(0)
        })

        it("should search jobs by level (case insensitive)", async () => {
            const res = await supertest(server.webApp)
                .get("/api/jobs/search?level=EXPERT")  // ✅ Uppercase
                .set("Authorization", `Bearer ${accessToken}`)

            expect(res.status).toBe(200)
        })

        it("should search with multiple filters", async () => {
            const res = await supertest(server.webApp)
                .get(`/api/jobs/search?jobCategoriesId=${categoryId1}&level=beginner&status=OPEN`)  // ✅ Mixed case
                .set("Authorization", `Bearer ${accessToken}`)

            expect(res.status).toBe(200)
        })

        it("should search by provinceId", async () => {
            const res = await supertest(server.webApp)
                .get("/api/jobs/search?provinceId=P35")
                .set("Authorization", `Bearer ${accessToken}`)

            expect(res.status).toBe(200)
        })
    })

    // ============================================
    // UPDATE JOB TESTS
    // ============================================
    describe("PATCH /api/jobs/:jobId", () => {
        it("should update job successfully", async () => {
            // Create job
            const createRes = await supertest(server.webApp)
                .post("/api/jobs")
                .set("Authorization", `Bearer ${accessToken}`)
                .send({
                    addressId: addressId,
                    jobCategoriesId: [categoryId1],
                    title: "Old Title",
                    description: "Old description",
                    level: ["beginner"],
                    type: "urgent",
                    required: 1,
                    jobSite: "remote",
                    status: "open"
                })

            const jobId = createRes.body.data.id

            // Update job
            const res = await supertest(server.webApp)
                .patch(`/api/jobs/${jobId}`)
                .set("Authorization", `Bearer ${accessToken}`)
                .send({
                    title: "New Title",
                    description: "New description"
                })

            expect(res.status).toBe(200)
            expect(res.body.data.title).toBe("New Title")
            expect(res.body.data.description).toBe("New description")
        })

        it("should reject if not job owner", async () => {
            // Create another user
            const hashed = await bcrypt.hash("Password123!", 10)
            const otherUser = await prismaClient.user.create({
                data: { 
                    username: "others",
                    email: "other@example.com",
                    password: hashed,
                    firstName: "Other",
                    birthDate: new Date("2000-01-01"),
                    phone: "+628123456798",
                    role: "USER",
                    status: "ACTIVE"
                }
            })

            // Create job as other user
            const otherJob = await prismaClient.job.create({
                data: {
                    jobProviderId: otherUser.id,
                    addressId: addressId,
                    title: "Other Job",
                    description: "Other description",
                    level: ["BEGINNER"],
                    type: "URGENT",
                    required: 1,
                    jobSite: "REMOTE",
                    status: "OPEN",
                    locations: {
                        lat: -7.2575,
                        lng: 112.7521,
                        street: "Jl. Test",
                        masterLocations: {
                            subdistrict: { id: subdistrictId, code: "35.78.01.1001", name: "Tegalsari" },
                            district: { id: "D357801", code: "35.78.01", name: "Tegalsari" },
                            city: { id: "C3578", code: "35.78", name: "Kota Surabaya" },
                            province: { id: "P35", code: "35", name: "Jawa Timur" }
                        }
                    }
                }
            })

            // Try to update as current user
            const res = await supertest(server.webApp)
                .patch(`/api/jobs/${otherJob.id}`)
                .set("Authorization", `Bearer ${accessToken}`)
                .send({
                    title: "Hacked Title"
                })

            expect(res.status).toBe(401)
            expect(res.body.errors).toContain("Not the owner")
        })

        it("should reject updating closed job", async () => {
            // Create job
            const job = await prismaClient.job.create({
                data: {
                    jobProviderId: userId,
                    addressId: addressId,
                    title: "Closed Job",
                    description: "description",
                    level: ["BEGINNER"],
                    type: "URGENT",
                    required: 1,
                    jobSite: "REMOTE",
                    status: "CLOSED",
                    locations: {
                        lat: -7.2575,
                        lng: 112.7521,
                        street: "Jl. Test",
                        masterLocations: {
                            subdistrict: { id: subdistrictId, code: "35.78.01.1001", name: "Tegalsari" },
                            district: { id: "D357801", code: "35.78.01", name: "Tegalsari" },
                            city: { id: "C3578", code: "35.78", name: "Kota Surabaya" },
                            province: { id: "P35", code: "35", name: "Jawa Timur" }
                        }
                    }
                }
            })

            const res = await supertest(server.webApp)
                .patch(`/api/jobs/${job.id}`)
                .set("Authorization", `Bearer ${accessToken}`)
                .send({
                    title: "New Title"
                })

            expect(res.status).toBe(400)
            expect(res.body.errors).toContain("Status job closed")
        })
    })

    // ============================================
    // DELETE JOB TESTS
    // ============================================
    describe("DELETE /api/jobs/:jobId", () => {
        it("should delete job successfully", async () => {
            // Create job
            const createRes = await supertest(server.webApp)
                .post("/api/jobs")
                .set("Authorization", `Bearer ${accessToken}`)
                .send({
                    addressId: addressId,
                    jobCategoriesId: [categoryId1],
                    title: "To Delete",
                    description: "Will be deleted",
                    level: ["beginner"],
                    type: "urgent",
                    required: 1,
                    jobSite: "remote",
                    status: "open"
                })

            const jobId = createRes.body.data.id

            // Delete job
            const res = await supertest(server.webApp)
                .delete(`/api/jobs/${jobId}`)
                .set("Authorization", `Bearer ${accessToken}`)

            expect(res.status).toBe(200)

            // Verify deleted
            const check = await prismaClient.job.findUnique({
                where: { id: jobId }
            })
            expect(check).toBeNull()
        })

        it("should reject if job not found", async () => {
            const res = await supertest(server.webApp)
                .delete("/api/jobs/invalid-job-id")
                .set("Authorization", `Bearer ${accessToken}`)

            expect(res.status).toBe(404)
            expect(res.body.errors).toContain("Job no found")
        })

        it("should reject if not job owner", async () => {
            // Create another user
            const hashed = await bcrypt.hash("Password123!", 10)
            const otherUser = await prismaClient.user.create({
                data: {
                    username: "otheruser2",
                    email: "other2@example.com",
                    password: hashed,
                    firstName: "Other",
                    birthDate: new Date("2000-01-01"),
                    phone: "+628123456797",
                    role: "USER",
                    status: "ACTIVE"
                }
            })

            // Create job as other user
            const otherJob = await prismaClient.job.create({
                data: {
                    jobProviderId: otherUser.id,
                    addressId: addressId,
                    title: "Other Job",
                    description: "description",
                    level: ["BEGINNER"],
                    type: "URGENT",
                    required: 1,
                    jobSite: "REMOTE",
                    status: "OPEN",
                    locations: {
                        lat: -7.2575,
                        lng: 112.7521,
                        street: "Jl. Test",
                        masterLocations: {
                            subdistrict: { id: subdistrictId, code: "35.78.01.1001", name: "Tegalsari" },
                            district: { id: "D357801", code: "35.78.01", name: "Tegalsari" },
                            city: { id: "C3578", code: "35.78", name: "Kota Surabaya" },
                            province: { id: "P35", code: "35", name: "Jawa Timur" }
                        }
                    }
                }
            })

            const res = await supertest(server.webApp)
                .delete(`/api/jobs/${otherJob.id}`)
                .set("Authorization", `Bearer ${accessToken}`)

            expect(res.status).toBe(401)
            expect(res.body.errors).toContain("Not the owner")
        })
    })

    // ============================================
    // LIST MY CREATED JOBS TESTS
    // ============================================
    describe("GET /api/jobs/provider", () => {
        it("should get user's created jobs", async () => {
            // Create 2 jobs
            await supertest(server.webApp)
                .post("/api/jobs")
                .set("Authorization", `Bearer ${accessToken}`)
                .send({
                    addressId: addressId,
                    jobCategoriesId: [categoryId1],
                    title: "My Job 1",
                    description: "Description 1",
                    level: ["beginner"],
                    type: "urgent",
                    required: 1,
                    jobSite: "remote",
                    status: "open"
                })

            await supertest(server.webApp)
                .post("/api/jobs")
                .set("Authorization", `Bearer ${accessToken}`)
                .send({
                    addressId: addressId,
                    jobCategoriesId: [categoryId2],
                    title: "My Job 2",
                    description: "Description 2",
                    level: ["expert"],
                    type: "non urgent",
                    required: 2,
                    jobSite: "on site",
                    status: "open"
                })

            const res = await supertest(server.webApp)
                .get("/api/jobs/provider")
                .set("Authorization", `Bearer ${accessToken}`)

            expect(res.status).toBe(200)
            expect(res.body.data.data.length).toBe(2)
            expect(res.body.data.paging).toBeDefined()
        })
    })

    // ============================================
    // AUTHORIZATION TESTS
    // ============================================
    describe("Authorization", () => {
        it("should reject requests without token", async () => {
            const res = await supertest(server.webApp)
                .get("/api/jobs/my-jobs")

            expect(res.status).toBe(401)
        })

        it("should reject requests with invalid token", async () => {
            const res = await supertest(server.webApp)
                .get("/api/jobs/my-jobs")
                .set("Authorization", "Bearer invalid-token")

            expect(res.status).toBe(401)
        })
    })
})