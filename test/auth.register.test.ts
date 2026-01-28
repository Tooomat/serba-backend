import { describe, it, expect, beforeEach, afterEach, afterAll } from '@jest/globals'
import supertest from "supertest"
import * as server from "../src/application/server"
import { prismaClient } from "../src/application/database"

describe("POST /api/auth/register", () => {
    
    beforeEach(async () => {
        await prismaClient.user.deleteMany({
            where: {
                username: {
                    in: ['testuser', 'testuser2', 'existinguser']
                }
            }
        })
    })

    afterEach(async () => {
        await prismaClient.user.deleteMany({
            where: {
                username: {
                    in: ['testuser', 'testuser2', 'existinguser']
                }
            }
        })
    })

    afterAll(async () => {
        await prismaClient.$disconnect()
    })

    // Test Case 1: Successful Registration
    it('should register new user successfully', async () => {
        const res = await supertest(server.webApp)
            .post("/api/auth/register")
            .set("Content-Type", "application/json")
            .send({
                username: "testuser",
                email: "testuser@example.com",
                password: "Password123!",
                firstName: "Test",
                lastName: "User",
                birthDate: "2000-01-01",
                phone: "+628123456789"
            })
        
        expect(res.status).toBe(201)
        expect(res.body.success).toBe(true)
        expect(res.body.data).toBeDefined()
        expect(res.body.data.id).toBeDefined()
        expect(res.body.data.username).toBe("testuser")
        expect(res.body.data.email).toBe("testuser@example.com")
        expect(res.body.data.firstName).toBe("Test")
        expect(res.body.data.lastName).toBe("User")
        expect(res.body.data.phone).toBe("+628123456789")
        expect(res.body.data.isEmailVerified).toBe(false)
        expect(res.body.data.isPhoneVerified).toBe(false)
        expect(res.body.data.status).toBeDefined()
        expect(res.body.data.createdAt).toBeDefined()
        expect(res.body.data.password).toBeUndefined()
    })

    // Test Case 2: Registration without optional fields
    it('should register user without optional fields (lastName, profilePictUrl)', async () => {
        const res = await supertest(server.webApp)
            .post("/api/auth/register")
            .set("Content-Type", "application/json")
            .send({
                username: "testuser2",
                email: "testuser2@example.com",
                password: "Password123!",
                firstName: "Test",
                birthDate: "2000-01-01",
                phone: "+628123456789"
            })
        
        expect(res.status).toBe(201)
        expect(res.body.success).toBe(true)
        expect(res.body.data.lastName).toBeNull()
        expect(res.body.data.profilePictUrl).toBeNull()
    })

    // Test Case 3: Invalid - Empty username
    it('should reject registration with empty username', async () => {
        const res = await supertest(server.webApp)
            .post("/api/auth/register")
            .set("Content-Type", "application/json")
            .send({
                username: "",
                email: "test@example.com",
                password: "Password123!",
                firstName: "Test",
                birthDate: "2000-01-01",
                phone: "+628123456789"
            })

        expect(res.status).toBe(400)
        expect(res.body.success).toBe(false)
        expect(res.body.errors).toBeDefined()
    })

    // Test Case 4: Invalid - Username too long
    it('should reject registration with username longer than 100 characters', async () => {
        const longUsername = "a".repeat(101)
        
        const res = await supertest(server.webApp)
            .post("/api/auth/register")
            .set("Content-Type", "application/json")
            .send({
                username: longUsername,
                email: "test@example.com",
                password: "Password123!",
                firstName: "Test",
                birthDate: "2000-01-01",
                phone: "+628123456789"
            })

        expect(res.status).toBe(400)
        expect(res.body.success).toBe(false)
        expect(res.body.errors).toBeDefined()
    })

    // Test Case 5: Invalid - Invalid email format
    it('should reject registration with invalid email format', async () => {
        const res = await supertest(server.webApp)
            .post("/api/auth/register")
            .set("Content-Type", "application/json")
            .send({
                username: "testuser",
                email: "invalid-email",
                password: "Password123!",
                firstName: "Test",
                birthDate: "2000-01-01",
                phone: "+628123456789"
            })

        expect(res.status).toBe(400)
        expect(res.body.success).toBe(false)
        expect(res.body.errors).toBeDefined()
    })

    // Test Case 6: Invalid - Password too short
    it('should reject registration with password less than 8 characters', async () => {
        const res = await supertest(server.webApp)
            .post("/api/auth/register")
            .set("Content-Type", "application/json")
            .send({
                username: "testuser",
                email: "test@example.com",
                password: "Pass12",
                firstName: "Test",
                birthDate: "2000-01-01",
                phone: "+628123456789"
            })

        expect(res.status).toBe(400)
        expect(res.body.success).toBe(false)
        expect(res.body.errors).toBeDefined()
    })

    // Test Case 7: Invalid - Empty firstName
    it('should reject registration with empty firstName', async () => {
        const res = await supertest(server.webApp)
            .post("/api/auth/register")
            .set("Content-Type", "application/json")
            .send({
                username: "testuser",
                email: "test@example.com",
                password: "Password123!",
                firstName: "",
                birthDate: "2000-01-01",
                phone: "+628123456789"
            })

        expect(res.status).toBe(400)
        expect(res.body.success).toBe(false)
        expect(res.body.errors).toBeDefined()
    })

    // Test Case 8: Invalid - Invalid date format
    it('should reject registration with invalid date format', async () => {
        const res = await supertest(server.webApp)
            .post("/api/auth/register")
            .set("Content-Type", "application/json")
            .send({
                username: "testuser",
                email: "test@example.com",
                password: "Password123!",
                firstName: "Test",
                birthDate: "01-01-2000",
                phone: "+628123456789"
            })

        expect(res.status).toBe(400)
        expect(res.body.success).toBe(false)
        expect(res.body.errors).toBeDefined()
    })

    // Test Case 9: Invalid - Phone number without +62
    it('should reject registration with phone number without +62 prefix', async () => {
        const res = await supertest(server.webApp)
            .post("/api/auth/register")
            .set("Content-Type", "application/json")
            .send({
                username: "testuser",
                email: "test@example.com",
                password: "Password123!",
                firstName: "Test",
                birthDate: "2000-01-01",
                phone: "08123456789"
            })

        expect(res.status).toBe(400)
        expect(res.body.success).toBe(false)
        expect(res.body.errors).toBeDefined()
    })

    // Test Case 10: Valid - Phone number with spaces and dashes
    it('should accept phone number with spaces and dashes', async () => {
        const res = await supertest(server.webApp)
            .post("/api/auth/register")
            .set("Content-Type", "application/json")
            .send({
                username: "testuser",
                email: "test@example.com",
                password: "Password123!",
                firstName: "Test",
                birthDate: "2000-01-01",
                phone: "+62 812-3456-7890"
            })
        
        expect(res.status).toBe(201)
        expect(res.body.success).toBe(true)
        expect(res.body.data.phone).toBe("+6281234567890")
    })

    // Test Case 11: Invalid - Phone number too short
    it('should reject registration with phone number too short', async () => {
        const res = await supertest(server.webApp)
            .post("/api/auth/register")
            .set("Content-Type", "application/json")
            .send({
                username: "testuser",
                email: "test@example.com",
                password: "Password123!",
                firstName: "Test",
                birthDate: "2000-01-01",
                phone: "+6281234"
            })

        expect(res.status).toBe(400)
        expect(res.body.success).toBe(false)
        expect(res.body.errors).toBeDefined()
    })

    // Test Case 12: Invalid - Phone number too long
    it('should reject registration with phone number too long', async () => {
        const res = await supertest(server.webApp)
            .post("/api/auth/register")
            .set("Content-Type", "application/json")
            .send({
                username: "testuser",
                email: "test@example.com",
                password: "Password123!",
                firstName: "Test",
                birthDate: "2000-01-01",
                phone: "+6281234567890123"
            })

        expect(res.status).toBe(400)
        expect(res.body.success).toBe(false)
        expect(res.body.errors).toBeDefined()
    })

    // Test Case 13: Duplicate username
    it('should reject registration with duplicate username', async () => {
        // Create first user
        await supertest(server.webApp)
            .post("/api/auth/register")
            .set("Content-Type", "application/json")
            .send({
                username: "existinguser",
                email: "existing@example.com",
                password: "Password123!",
                firstName: "Existing",
                birthDate: "2000-01-01",
                phone: "+628123456789"
            })

        // Try to create user with same username
        const res = await supertest(server.webApp)
            .post("/api/auth/register")
            .set("Content-Type", "application/json")
            .send({
                username: "existinguser",
                email: "different@example.com",
                password: "Password123!",
                firstName: "Different",
                birthDate: "2000-01-01",
                phone: "+628987654321"
            })

        expect(res.status).toBe(400)
        expect(res.body.success).toBe(false)
        expect(res.body.errors).toBeDefined()
    })

    // Test Case 14: Duplicate email
    it('should reject registration with duplicate email', async () => {
        // Create first user
        await supertest(server.webApp)
            .post("/api/auth/register")
            .set("Content-Type", "application/json")
            .send({
                username: "existinguser",
                email: "existing@example.com",
                password: "Password123!",
                firstName: "Existing",
                birthDate: "2000-01-01",
                phone: "+628123456789"
            })

        // Try to create user with same email
        const res = await supertest(server.webApp)
            .post("/api/auth/register")
            .set("Content-Type", "application/json")
            .send({
                username: "differentuser",
                email: "existing@example.com",
                password: "Password123!",
                firstName: "Different",
                birthDate: "2000-01-01",
                phone: "+628987654321"
            })

        expect(res.status).toBe(400)
        expect(res.body.success).toBe(false)
        expect(res.body.errors).toBeDefined()
    })

    // Test Case 15: Missing required fields
    it('should reject registration with missing required fields', async () => {
        const res = await supertest(server.webApp)
            .post("/api/auth/register")
            .set("Content-Type", "application/json")
            .send({
                username: "testuser",
                email: "test@example.com"
            })

        expect(res.status).toBe(400)
        expect(res.body.success).toBe(false)
        expect(res.body.errors).toBeDefined()
    })
})
