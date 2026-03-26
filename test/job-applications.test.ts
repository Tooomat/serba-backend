import { describe, it, expect, beforeEach, afterEach, afterAll } from '@jest/globals'
import supertest from "supertest"
import * as server from "../src/application/server"
import { prismaClient } from "../src/application/database"
import { redis } from "../src/application/redis"
import bcrypt from "bcrypt"

describe("Job Applications API Tests", () => {
    let workerToken: string
    let providerToken: string
    let workerId: string
    let providerId: string
    let jobId: string
    let addressId: string
    let subdistrictId: string
    let categoryId: string

    beforeEach(async () => {
        // ===== CLEANUP =====
        await prismaClient.notifications.deleteMany({})
        await prismaClient.jobApplication.deleteMany({})
        await prismaClient.categoriesMapping.deleteMany({})
        await prismaClient.job.deleteMany({})
        await prismaClient.address.deleteMany({})
        await prismaClient.masterSubdistrict.deleteMany({})
        await prismaClient.masterDistrict.deleteMany({})
        await prismaClient.masterCity.deleteMany({})
        await prismaClient.masterProvince.deleteMany({})
        await prismaClient.user.deleteMany({
            where: { username: { in: ['jobapp_worker', 'jobapp_provider'] } }
        })

        // ===== SEED WORKER =====
        const hashed = await bcrypt.hash("Password123!", 10)
        const worker = await prismaClient.user.create({
            data: {
                username: "jobapp_worker",
                email: "ardijr62@gmail.com",
                password: hashed,
                firstName: "Worker",
                lastName: "User",
                birthDate: new Date("2000-01-01"),
                phone: "+628111111111",
                role: "USER",
                status: "ACTIVE"
            }
        })
        workerId = worker.id

        // ===== SEED PROVIDER =====
        const provider = await prismaClient.user.create({
            data: {
                username: "jobapp_provider",
                email: "provider@example.com",
                password: hashed,
                firstName: "Provider",
                lastName: "User",
                birthDate: new Date("2000-01-01"),
                phone: "+628222222222",
                role: "USER",
                status: "ACTIVE"
            }
        })
        providerId = provider.id

        // ===== LOGIN WORKER =====
        const workerLogin = await supertest(server.webApp)
            .post("/public/api/auth/login")
            .send({ usernameOrEmail: "jobapp_worker", password: "Password123!" })
        workerToken = workerLogin.body.data.accessToken

        // ===== LOGIN PROVIDER =====
        const providerLogin = await supertest(server.webApp)
            .post("/public/api/auth/login")
            .send({ usernameOrEmail: "jobapp_provider", password: "Password123!" })
        providerToken = providerLogin.body.data.accessToken

        // ===== SEED MASTER LOCATION =====
        const province = await prismaClient.masterProvince.create({
            data: { id: "P35", code: "35", name: "Jawa Timur" }
        })
        const city = await prismaClient.masterCity.create({
            data: {
                id: "C3578", code: "35.78", name: "Kota Surabaya",
                provinceId: province.id,
                province: { id: province.id, code: province.code, name: province.name }
            }
        })
        const district = await prismaClient.masterDistrict.create({
            data: {
                id: "D357801", code: "35.78.01", name: "Tegalsari",
                cityId: city.id,
                city: { id: city.id, code: city.code, name: city.name },
                province: { id: province.id, code: province.code, name: province.name }
            }
        })
        const subdistrict = await prismaClient.masterSubdistrict.create({
            data: {
                id: "SD35780101", code: "35.78.01.1001", name: "Tegalsari",
                districtId: district.id,
                district: { id: district.id, code: district.code, name: district.name },
                city: { id: city.id, code: city.code, name: city.name },
                province: { id: province.id, code: province.code, name: province.name }
            }
        })
        subdistrictId = subdistrict.id

        // ===== SEED ADDRESS FOR PROVIDER =====
        const address = await prismaClient.address.create({
            data: {
                userId: providerId,
                subdistrictId: subdistrictId,
                street: "Jl. Provider No. 1",
                postalCode: "60123",
                markAs: "HOME",
                isPrimary: true,
                lat: "-7.2575",
                lng: "112.7521",
                locations: {
                    subdistrict: { id: subdistrict.id, code: subdistrict.code, name: subdistrict.name },
                    district: { id: district.id, code: district.code, name: district.name },
                    city: { id: city.id, code: city.code, name: city.name },
                    province: { id: province.id, code: province.code, name: province.name }
                }
            }
        })
        addressId = address.id

        // ===== SEED CATEGORY =====
        const categories = await prismaClient.jobCategory.findMany({ take: 1 })
        if (categories.length === 0) throw new Error("Job categories not seeded. Run: npm run seed")
        categoryId = categories[0].id

        // ===== SEED JOB =====
        const job = await prismaClient.job.create({
            data: {
                jobProviderId: providerId,
                addressId: addressId,
                title: "Tukang Sanyo",
                description: "Perbaikan pompa air",
                level: ["BEGINNER"],
                type: "URGENT",
                required: 2,
                jobSite: "ON_SITE",
                status: "OPEN",
                isPublic: true,
                locations: {
                    lat: -7.2575,
                    lng: 112.7521,
                    street: "Jl. Provider No. 1",
                    masterLocations: {
                        subdistrict: { id: subdistrictId, code: "35.78.01.1001", name: "Tegalsari" },
                        district: { id: "D357801", code: "35.78.01", name: "Tegalsari" },
                        city: { id: "C3578", code: "35.78", name: "Kota Surabaya" },
                        province: { id: "P35", code: "35", name: "Jawa Timur" }
                    }
                }
            }
        })
        jobId = job.id

        await prismaClient.categoriesMapping.create({
            data: { jobId: job.id, jobCategoryId: categoryId }
        })
    })

    afterEach(async () => {
        await prismaClient.notifications.deleteMany({})
        await prismaClient.jobApplication.deleteMany({})
        await prismaClient.categoriesMapping.deleteMany({})
        await prismaClient.job.deleteMany({})
        await prismaClient.address.deleteMany({})
        await prismaClient.masterSubdistrict.deleteMany({})
        await prismaClient.masterDistrict.deleteMany({})
        await prismaClient.masterCity.deleteMany({})
        await prismaClient.masterProvince.deleteMany({})
        await prismaClient.user.deleteMany({
            where: { username: { in: ['jobapp_worker', 'jobapp_provider'] } }
        })
        await redis.flushdb()
    })

    afterAll(async () => {
        await prismaClient.$disconnect()
        await redis.quit()
    })

    // ============================================
    // CREATE JOB APPLICATION
    // ============================================
    describe("POST /api/jobs/:jobId/jobApplications", () => {
        it("should create job application successfully without cover letter", async () => {
            const res = await supertest(server.webApp)
                .post(`/api/jobs/${jobId}/jobApplications`)
                .set("Authorization", `Bearer ${workerToken}`)
                .send({})

            expect(res.status).toBe(201)
            expect(res.body.success).toBe(true)
            expect(res.body.data.status).toBeDefined()
            expect(res.body.data.job.id).toBe(jobId)
            expect(res.body.data.job.applicationCount).toBe(1)
        })

        it("should create job application successfully with cover letter", async () => {
            const res = await supertest(server.webApp)
                .post(`/api/jobs/${jobId}/jobApplications`)
                .set("Authorization", `Bearer ${workerToken}`)
                .send({ coverLetter: "Saya tertarik dengan pekerjaan ini." })

            expect(res.status).toBe(201)
            expect(res.body.data.coverLetter).toBe("Saya tertarik dengan pekerjaan ini.")
        })

        it("should reject if job not found", async () => {
            const res = await supertest(server.webApp)
                .post(`/api/jobs/invalid-job-id/jobApplications`)
                .set("Authorization", `Bearer ${workerToken}`)
                .send({})

            expect(res.status).toBe(404)
            expect(res.body.errors).toContain("Job not found")
        })

        it("should reject if provider applies to own job", async () => {
            const res = await supertest(server.webApp)
                .post(`/api/jobs/${jobId}/jobApplications`)
                .set("Authorization", `Bearer ${providerToken}`)
                .send({})

            expect(res.status).toBe(403)
            expect(res.body.errors).toContain("Cannot apply to your own job")
        })

        it("should reject duplicate application", async () => {
            await supertest(server.webApp)
                .post(`/api/jobs/${jobId}/jobApplications`)
                .set("Authorization", `Bearer ${workerToken}`)
                .send({})

            const res = await supertest(server.webApp)
                .post(`/api/jobs/${jobId}/jobApplications`)
                .set("Authorization", `Bearer ${workerToken}`)
                .send({})

            expect(res.status).toBe(409)
            expect(res.body.errors).toContain("You have already applied to this job")
        })

        it("should reject if job is closed", async () => {
            await prismaClient.job.update({
                where: { id: jobId },
                data: { status: "CLOSED" }
            })

            const res = await supertest(server.webApp)
                .post(`/api/jobs/${jobId}/jobApplications`)
                .set("Authorization", `Bearer ${workerToken}`)
                .send({})

            expect(res.status).toBe(400)
            expect(res.body.errors).toContain("Cannot apply, job is permanently closed")
        })

        it("should reject if job is in progress", async () => {
            await prismaClient.job.update({
                where: { id: jobId },
                data: { status: "IN_PROGRESS" }
            })

            const res = await supertest(server.webApp)
                .post(`/api/jobs/${jobId}/jobApplications`)
                .set("Authorization", `Bearer ${workerToken}`)
                .send({})

            expect(res.status).toBe(400)
        })

        it("should reject without token", async () => {
            const res = await supertest(server.webApp)
                .post(`/api/jobs/${jobId}/jobApplications`)
                .send({})

            expect(res.status).toBe(401)
        })
    })

    // ============================================
    // UPDATE JOB APPLICATION STATUS
    // ============================================
    describe("PATCH /api/jobApplications/:jobApplicationId/status", () => {
        let jobApplicationId: string

        beforeEach(async () => {
            const res = await supertest(server.webApp)
                .post(`/api/jobs/${jobId}/jobApplications`)
                .set("Authorization", `Bearer ${workerToken}`)
                .send({ coverLetter: "Saya siap bekerja." })

            jobApplicationId = res.body.data.id
        })

        it("should accept application successfully", async () => {
            const res = await supertest(server.webApp)
                .patch(`/api/jobApplications/${jobApplicationId}/status`)
                .set("Authorization", `Bearer ${providerToken}`)
                .send({
                    status: "accepted",
                    jobMessage: "Selamat, Anda diterima!",
                    rejectedGlobalMessage: ""
                })

            expect(res.status).toBe(200)
            expect(res.body.data.status).toBe("Accepted")
            expect(res.body.data.acceptedAt).not.toBeNull()
        })

        it("should reject application successfully", async () => {
            const res = await supertest(server.webApp)
                .patch(`/api/jobApplications/${jobApplicationId}/status`)
                .set("Authorization", `Bearer ${providerToken}`)
                .send({
                    status: "rejected",
                    jobMessage: "Mohon maaf, Anda tidak lolos.",
                    rejectedGlobalMessage: ""
                })

            expect(res.status).toBe(200)
            expect(res.body.data.status).toBe("Rejected")
            expect(res.body.data.rejectedAt).not.toBeNull()
        })

        it("should shortlist application successfully", async () => {
            const res = await supertest(server.webApp)
                .patch(`/api/jobApplications/${jobApplicationId}/status`)
                .set("Authorization", `Bearer ${providerToken}`)
                .send({
                    status: "shortlisted",
                    jobMessage: "Anda masuk shortlist.",
                    rejectedGlobalMessage: ""
                })

            expect(res.status).toBe(200)
            expect(res.body.data.status).toBe("Shortlisted")
        })

        it("should close job and reject others when last slot accepted", async () => {
            // Update job required to 1
            await prismaClient.job.update({
                where: { id: jobId },
                data: { required: 1 }
            })

            // Seed worker2
            const hashed = await bcrypt.hash("Password123!", 10)
            const worker2 = await prismaClient.user.create({
                data: {
                    username: "jobapp_worker2",
                    email: "worker2@example.com",
                    password: hashed,
                    firstName: "Worker2",
                    birthDate: new Date("2000-01-01"),
                    phone: "+628333333333",
                    role: "USER",
                    status: "ACTIVE"
                }
            })
            const worker2Login = await supertest(server.webApp)
                .post("/public/api/auth/login")
                .send({ usernameOrEmail: "jobapp_worker2", password: "Password123!" })
            const worker2Token = worker2Login.body.data.accessToken

            // Worker2 apply
            const applyRes = await supertest(server.webApp)
                .post(`/api/jobs/${jobId}/jobApplications`)
                .set("Authorization", `Bearer ${worker2Token}`)
                .send({})
            const worker2AppId = applyRes.body.data.id

            // Accept worker1 (last slot)
            const res = await supertest(server.webApp)
                .patch(`/api/jobApplications/${jobApplicationId}/status`)
                .set("Authorization", `Bearer ${providerToken}`)
                .send({
                    status: "accepted",
                    jobMessage: "Diterima!",
                    rejectedGlobalMessage: "Maaf, posisi sudah terisi."
                })

            expect(res.status).toBe(200)
            expect(res.body.data.status).toBe("Accepted")

            // Check job is closed
            const job = await prismaClient.job.findUnique({ where: { id: jobId } })
            expect(job?.status).toBe("CLOSED")

            // Check worker2 app is rejected
            const worker2App = await prismaClient.jobApplication.findUnique({
                where: { id: worker2AppId }
            })
            expect(worker2App?.status).toBe("REJECTED")

            // Cleanup worker2
            await prismaClient.user.delete({ where: { id: worker2.id } })
        })

        it("should reject if not job owner", async () => {
            const res = await supertest(server.webApp)
                .patch(`/api/jobApplications/${jobApplicationId}/status`)
                .set("Authorization", `Bearer ${workerToken}`)
                .send({
                    status: "accepted",
                    jobMessage: "Test",
                    rejectedGlobalMessage: ""
                })

            expect(res.status).toBe(401)
        })

        it("should reject updating already accepted application", async () => {
            // Accept first
            await supertest(server.webApp)
                .patch(`/api/jobApplications/${jobApplicationId}/status`)
                .set("Authorization", `Bearer ${providerToken}`)
                .send({
                    status: "accepted",
                    jobMessage: "Diterima!",
                    rejectedGlobalMessage: ""
                })

            // Try accept again
            const res = await supertest(server.webApp)
                .patch(`/api/jobApplications/${jobApplicationId}/status`)
                .set("Authorization", `Bearer ${providerToken}`)
                .send({
                    status: "rejected",
                    jobMessage: "Test",
                    rejectedGlobalMessage: ""
                })

            expect(res.status).toBe(400)
            expect(res.body.errors).toContain("application already accepted")
        })

        it("should reject updating already rejected application", async () => {
            await supertest(server.webApp)
                .patch(`/api/jobApplications/${jobApplicationId}/status`)
                .set("Authorization", `Bearer ${providerToken}`)
                .send({
                    status: "rejected",
                    jobMessage: "Ditolak.",
                    rejectedGlobalMessage: ""
                })

            const res = await supertest(server.webApp)
                .patch(`/api/jobApplications/${jobApplicationId}/status`)
                .set("Authorization", `Bearer ${providerToken}`)
                .send({
                    status: "accepted",
                    jobMessage: "Test",
                    rejectedGlobalMessage: ""
                })

            expect(res.status).toBe(400)
            expect(res.body.errors).toContain("application already rejected")
        })

        it("should reject with invalid status", async () => {
            const res = await supertest(server.webApp)
                .patch(`/api/jobApplications/${jobApplicationId}/status`)
                .set("Authorization", `Bearer ${providerToken}`)
                .send({
                    status: "invalid-status",
                    jobMessage: "Test",
                    rejectedGlobalMessage: ""
                })

            expect(res.status).toBe(400)
        })

        it("should reject if application not found", async () => {
            const res = await supertest(server.webApp)
                .patch(`/api/jobApplications/invalid-id/status`)
                .set("Authorization", `Bearer ${providerToken}`)
                .send({
                    status: "accepted",
                    jobMessage: "Test",
                    rejectedGlobalMessage: ""
                })

            expect(res.status).toBe(404)
            expect(res.body.errors).toContain("Job application not found")
        })
    })

    // ============================================
    // GET DETAIL JOB APPLICATION
    // ============================================
    describe("GET /api/jobApplications/:jobApplicationId", () => {
        let jobApplicationId: string

        beforeEach(async () => {
            const res = await supertest(server.webApp)
                .post(`/api/jobs/${jobId}/jobApplications`)
                .set("Authorization", `Bearer ${workerToken}`)
                .send({ coverLetter: "Saya siap bekerja." })

            jobApplicationId = res.body.data.id
        })

        it("should get detail as worker", async () => {
            const res = await supertest(server.webApp)
                .get(`/api/jobApplications/${jobApplicationId}`)
                .set("Authorization", `Bearer ${workerToken}`)

            expect(res.status).toBe(200)
            expect(res.body.data.id).toBe(jobApplicationId)
            expect(res.body.data.job).toBeDefined()
            expect(res.body.data.jobProvider).toBeDefined()
            expect(res.body.data.worker).toBeUndefined()
        })

        it("should get detail as provider and auto-set reviewed", async () => {
            const res = await supertest(server.webApp)
                .get(`/api/jobApplications/${jobApplicationId}`)
                .set("Authorization", `Bearer ${providerToken}`)

            expect(res.status).toBe(200)
            expect(res.body.data.id).toBe(jobApplicationId)
            expect(res.body.data.worker).toBeDefined()
            expect(res.body.data.jobProvider).toBeUndefined()

            // Check status auto-reviewed in DB
            const app = await prismaClient.jobApplication.findUnique({
                where: { id: jobApplicationId }
            })
            expect(app?.status).toBe("REVIEWED")
            expect(app?.reviewedAt).not.toBeNull()
        })

        it("should not update reviewed status if already reviewed", async () => {
            // First access by provider
            await supertest(server.webApp)
                .get(`/api/jobApplications/${jobApplicationId}`)
                .set("Authorization", `Bearer ${providerToken}`)

            const firstReview = await prismaClient.jobApplication.findUnique({
                where: { id: jobApplicationId }
            })
            const firstReviewedAt = firstReview?.reviewedAt

            // Second access by provider
            await supertest(server.webApp)
                .get(`/api/jobApplications/${jobApplicationId}`)
                .set("Authorization", `Bearer ${providerToken}`)

            const secondReview = await prismaClient.jobApplication.findUnique({
                where: { id: jobApplicationId }
            })

            // reviewedAt should not change
            expect(secondReview?.reviewedAt).toEqual(firstReviewedAt)
        })

        it("should reject if application not found", async () => {
            const res = await supertest(server.webApp)
                .get(`/api/jobApplications/invalid-id`)
                .set("Authorization", `Bearer ${workerToken}`)

            expect(res.status).toBe(404)
        })

        it("should reject if user is not worker nor provider of the application", async () => {
            const hashed = await bcrypt.hash("Password123!", 10)
            const stranger = await prismaClient.user.create({
                data: {
                    username: "jobapp_stranger",
                    email: "stranger@example.com",
                    password: hashed,
                    firstName: "Stranger",
                    birthDate: new Date("2000-01-01"),
                    phone: "+628444444444",
                    role: "USER",
                    status: "ACTIVE"
                }
            })
            const strangerLogin = await supertest(server.webApp)
                .post("/public/api/auth/login")
                .send({ usernameOrEmail: "jobapp_stranger", password: "Password123!" })
            const strangerToken = strangerLogin.body.data.accessToken

            const res = await supertest(server.webApp)
                .get(`/api/jobApplications/${jobApplicationId}`)
                .set("Authorization", `Bearer ${strangerToken}`)

            expect(res.status).toBe(403)

            await prismaClient.user.delete({ where: { id: stranger.id } })
        })
    })

    // ============================================
    // GET LIST JOB APPLICATIONS (PROVIDER VIEW)
    // ============================================
    describe("GET /api/jobs/:jobId/jobApplications", () => {
        beforeEach(async () => {
            // Worker apply
            await supertest(server.webApp)
                .post(`/api/jobs/${jobId}/jobApplications`)
                .set("Authorization", `Bearer ${workerToken}`)
                .send({ coverLetter: "Saya siap." })
        })

        it("should get list as provider", async () => {
            const res = await supertest(server.webApp)
                .get(`/api/jobs/${jobId}/jobApplications`)
                .set("Authorization", `Bearer ${providerToken}`)

            expect(res.status).toBe(200)
            expect(res.body.data.data.length).toBeGreaterThan(0)
            expect(res.body.data.paging).toBeDefined()
            expect(res.body.data.data[0].worker).toBeDefined()
        })

        it("should filter by status", async () => {
            const res = await supertest(server.webApp)
                .get(`/api/jobs/${jobId}/jobApplications?status=applied`)
                .set("Authorization", `Bearer ${providerToken}`)

            expect(res.status).toBe(200)
            expect(res.body.data.data.length).toBeGreaterThan(0)
        })

        it("should filter by worker name", async () => {
            const res = await supertest(server.webApp)
                .get(`/api/jobs/${jobId}/jobApplications?name=Worker`)
                .set("Authorization", `Bearer ${providerToken}`)

            expect(res.status).toBe(200)
            expect(res.body.data.data.length).toBeGreaterThan(0)
        })

        it("should support pagination", async () => {
            const res = await supertest(server.webApp)
                .get(`/api/jobs/${jobId}/jobApplications?page=1&size=5`)
                .set("Authorization", `Bearer ${providerToken}`)

            expect(res.status).toBe(200)
            expect(res.body.data.paging.currentPage).toBe(1)
            expect(res.body.data.paging.size).toBe(5)
        })

        it("should return empty data if job has no applications", async () => {
            // Create new job with no applications
            const newJob = await prismaClient.job.create({
                data: {
                    jobProviderId: providerId,
                    addressId: addressId,
                    title: "Empty Job",
                    description: "No applications",
                    level: ["BEGINNER"],
                    type: "URGENT",
                    required: 1,
                    jobSite: "REMOTE",
                    status: "OPEN",
                    isPublic: true,
                    locations: {
                        lat: -7.2575, lng: 112.7521, street: "Jl. Test",
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
                .get(`/api/jobs/${newJob.id}/jobApplications`)
                .set("Authorization", `Bearer ${providerToken}`)

            expect(res.status).toBe(200)
            expect(res.body.data.data).toHaveLength(0)
        })
    })

    // ============================================
    // GET LIST JOB APPLICATIONS (WORKER VIEW)
    // ============================================
    describe("GET /api/jobApplications", () => {
        beforeEach(async () => {
            // Worker apply
            await supertest(server.webApp)
                .post(`/api/jobs/${jobId}/jobApplications`)
                .set("Authorization", `Bearer ${workerToken}`)
                .send({ coverLetter: "Saya siap." })
        })

        it("should get list as worker", async () => {
            const res = await supertest(server.webApp)
                .get(`/api/jobApplications`)
                .set("Authorization", `Bearer ${workerToken}`)

            expect(res.status).toBe(200)
            expect(res.body.data.data.length).toBeGreaterThan(0)
            expect(res.body.data.paging).toBeDefined()
            expect(res.body.data.data[0].jobProvider).toBeDefined()
            expect(res.body.data.data[0].job).toBeDefined()
        })

        it("should filter by status", async () => {
            const res = await supertest(server.webApp)
                .get(`/api/jobApplications?status=applied`)
                .set("Authorization", `Bearer ${workerToken}`)

            expect(res.status).toBe(200)
            expect(res.body.data.data.length).toBeGreaterThan(0)
        })

        it("should filter by provider name", async () => {
            const res = await supertest(server.webApp)
                .get(`/api/jobApplications?name=Provider`)
                .set("Authorization", `Bearer ${workerToken}`)

            expect(res.status).toBe(200)
            expect(res.body.data.data.length).toBeGreaterThan(0)
        })

        it("should return empty if worker has no applications", async () => {
            // Login as provider (no applications as worker)
            const res = await supertest(server.webApp)
                .get(`/api/jobApplications`)
                .set("Authorization", `Bearer ${providerToken}`)

            expect(res.status).toBe(200)
            expect(res.body.data.data).toHaveLength(0)
        })

        it("should support pagination", async () => {
            const res = await supertest(server.webApp)
                .get(`/api/jobApplications?page=1&size=5`)
                .set("Authorization", `Bearer ${workerToken}`)

            expect(res.status).toBe(200)
            expect(res.body.data.paging.currentPage).toBe(1)
            expect(res.body.data.paging.size).toBe(5)
        })
    })

    // ============================================
    // AUTHORIZATION TESTS
    // ============================================
    describe("Authorization", () => {
        it("should reject apply without token", async () => {
            const res = await supertest(server.webApp)
                .post(`/api/jobs/${jobId}/jobApplications`)
                .send({})

            expect(res.status).toBe(401)
        })

        it("should reject get list without token", async () => {
            const res = await supertest(server.webApp)
                .get(`/api/jobApplications`)

            expect(res.status).toBe(401)
        })

        it("should reject with invalid token", async () => {
            const res = await supertest(server.webApp)
                .get(`/api/jobApplications`)
                .set("Authorization", "Bearer invalid-token")

            expect(res.status).toBe(401)
        })
    })
})