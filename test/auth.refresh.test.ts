import { describe, it, expect, beforeAll, beforeEach, afterEach, afterAll } from '@jest/globals'
import supertest from 'supertest'
import * as server from '../src/application/server'
import { prismaClient } from '../src/application/database'
import { redis } from '../src/application/redis'
import { JWT } from '../src/utils/jwt.utils'

describe('POST /api/auth/refresh', () => {
  let refreshTokenCookie: string
  let userId: string

  // ================= SETUP =================

  beforeAll(async () => {
    await prismaClient.user.deleteMany({
      where: { username: 'refreshuser' }
    })
  })

  beforeEach(async () => {
    // register
    await supertest(server.webApp)
      .post('/api/auth/register')
      .send({
        username: 'refreshuser',
        email: 'refresh@example.com',
        password: 'Password123!',
        firstName: 'Refresh',
        birthDate: '2000-01-01',
        phone: '+628123456789'
      })

    // login
    const loginRes = await supertest(server.webApp)
      .post('/api/auth/login')
      .send({
        usernameOrEmail: 'refreshuser',
        password: 'Password123!'
      })

    // ===== normalize cookie header =====
    const cookies = loginRes.headers['set-cookie']
    if (!cookies) throw new Error('Set-Cookie header not found')

    const cookieArray = Array.isArray(cookies) ? cookies : [cookies]

    const refreshCookie = cookieArray.find((c: string) =>
      c.startsWith('refresh_token=')
    )

    if (!refreshCookie) throw new Error('Refresh token cookie not found')

    refreshTokenCookie = refreshCookie.split(';')[0]

    const payload = JWT.verifyRefreshToken(
      refreshTokenCookie.replace('refresh_token=', '')
    )

    userId = payload.sub
  })

  afterEach(async () => {
    await prismaClient.user.deleteMany({
      where: { username: 'refreshuser' }
    })
    await redis.flushdb()
  })

  afterAll(async () => {
    await prismaClient.$disconnect()
    await redis.quit()
  })

  // ================= SUCCESS =================

  it('should refresh access token successfully', async () => {
    const res = await supertest(server.webApp)
      .post('/api/auth/refresh')
      .set('Cookie', refreshTokenCookie)

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.data.newAccessToken).toBeDefined()
  })

  it('should allow refresh token to be reused multiple times', async () => {
    for (let i = 0; i < 3; i++) {
      const res = await supertest(server.webApp)
        .post('/api/auth/refresh')
        .set('Cookie', refreshTokenCookie)

      expect(res.status).toBe(200)
      expect(res.body.data.newAccessToken).toBeDefined()
    }
  })

  // ================= ERROR =================

  it('should reject when refresh token cookie missing', async () => {
    const res = await supertest(server.webApp)
      .post('/api/auth/refresh')

    expect(res.status).toBe(401)
    expect(res.body.errors).toBe('Missing refresh token')
  })

  it('should reject invalid refresh token', async () => {
    const res = await supertest(server.webApp)
      .post('/api/auth/refresh')
      .set('Cookie', 'refresh_token=invalid.token.value')

    expect(res.status).toBe(401)
    expect(res.body.errors).toBe('Invalid refresh token')
  })

  it('should reject expired refresh token (treated as revoked)', async () => {
    const { token, jti } = JWT.generateRefreshToken({ sub: userId })

    await redis.set(
      `refresh:${userId}:${jti}`,
      token,
      'EX',
      1
    )

    await new Promise(r => setTimeout(r, 1100))

    const res = await supertest(server.webApp)
      .post('/api/auth/refresh')
      .set('Cookie', `refresh_token=${token}`)

    expect(res.status).toBe(401)
    expect(res.body.errors).toBe('Refresh token revoke')
  })

  it('should reject revoked refresh token', async () => {
    const payload = JWT.verifyRefreshToken(
      refreshTokenCookie.replace('refresh_token=', '')
    )

    await redis.del(`refresh:${payload.sub}:${payload.jti}`)

    const res = await supertest(server.webApp)
      .post('/api/auth/refresh')
      .set('Cookie', refreshTokenCookie)

    expect(res.status).toBe(401)
    expect(res.body.errors).toBe('Refresh token revoke')
  })

  it('should reject refresh token mismatch with redis', async () => {
    const payload = JWT.verifyRefreshToken(
      refreshTokenCookie.replace('refresh_token=', '')
    )

    await redis.set(
      `refresh:${payload.sub}:${payload.jti}`,
      'different-token',
      'EX',
      60
    )

    const res = await supertest(server.webApp)
      .post('/api/auth/refresh')
      .set('Cookie', refreshTokenCookie)

    expect(res.status).toBe(401)
    expect(res.body.errors).toBe('Invalid refresh token')
  })

  it('should reject when user not found', async () => {
    await prismaClient.user.delete({
      where: { id: userId }
    })

    const res = await supertest(server.webApp)
      .post('/api/auth/refresh')
      .set('Cookie', refreshTokenCookie)

    expect(res.status).toBe(401)
    expect(res.body.errors).toBe('User not found')
  })

  it('should reject when user is blocked', async () => {
    await prismaClient.user.update({
      where: { id: userId },
      data: { status: 'BLOCKED' }
    })

    const res = await supertest(server.webApp)
      .post('/api/auth/refresh')
      .set('Cookie', refreshTokenCookie)

    expect(res.status).toBe(403)
    expect(res.body.errors).toBe('Account has been blocked')
  })
})
