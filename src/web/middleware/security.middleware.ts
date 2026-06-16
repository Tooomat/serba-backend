import { config } from "../../config/env"
import cors from 'cors'
import { redis } from "../../application/redis"
import { 
    RateLimiterRedis, 
    RateLimiterMemory, 
    RateLimiterRes, 
    RateLimiterAbstract 
} from "rate-limiter-flexible"
import { Request , Response, NextFunction } from "express"
import helmet from "helmet";
import { filterXSS } from 'xss'
import hpp from "hpp"
import { securityLogger } from "../../utils/logging.utils"

const isDev = config.NODE_ENV === 'development'
const isTest = config.NODE_ENV === 'test'
const isProd = config.NODE_ENV === 'production'

// ================================
// CORS — Cross-Origin Resource Sharing
// ================================
// CORS mengontrol domain mana yang boleh akses API.
// Tanpa CORS, browser akan blokir request dari domain lain.
export const corsGuard = cors({
    origin: (origin, callback) => {
        if (isDev || isTest) {
            return callback(null, true)
        }
        const allowedOrigins = config.CORS_ORIGIN?.split(',') ?? []
        if (!origin) return callback(null, true)
        if (allowedOrigins.includes(origin)) {
            callback(null, true)
        } else {
            callback(new Error(`CORS: Origin ${origin} not allowed`))
        }
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true, // izinkan cookie/auth header
    maxAge: 86400 // cache preflight 24 jam
})

// ================================
// RATE LIMIT REQUEST — Mencegah DDOS & Brute Force
// ================================
// Rate limit membatasi jumlah request dalam waktu tertentu.
// problem: attacker bisa kirim jutaan request sekaligus (DDOS)
// atau coba ribuan password (brute force).
//
// Strategi berbeda untuk public vs private:
// - Public: berdasarkan IP (belum login, tidak ada userId)
// - Private: berdasarkan userId (lebih akurat, tidak bisa bypass ganti IP)
const createLimiter = (
    keyPrefix: string,
    points: { prod: number, dev: number },
    duration: number,
    block: number
): RateLimiterAbstract => {
    const resolvedPoints = isTest ? 9999 : isDev ? points.dev : points.prod

    if (isTest) {
        return new RateLimiterMemory({
            keyPrefix,
            points: resolvedPoints,
            duration
        })
    }

    return new RateLimiterRedis({
        storeClient: redis,
        keyPrefix,
        points: resolvedPoints,
        duration,
        blockDuration: 60 * block    // block 60 detik setelah exceed
    })
}

// Public: 100 req / 1 menit / IP
const publicLimiter = createLimiter(
    `${config.APP_NAME}:rl:public`,
    { prod: 60, dev: 10 },
    1 * 60, // 60 menit
    1 // menit block
)

// AUTH:
// 5 req / 5 menit / IP 
const authLoginLimiter = createLimiter(
    `${config.APP_NAME}:rl:login:auth`,
    { prod: 5, dev: 10 },
    5 * 60, // 15 menit
    2 // menit block
)
// 3 req / 10 menit / IP 
const authRegisterLimiter = createLimiter(
    `${config.APP_NAME}:rl:register:auth`,
    { prod: 3, dev: 10 },
    10 * 60, // menit
    1 // menit block
)
// 15 req / 1 menit / IP
const authRefreshLimiter = createLimiter(
    `${config.APP_NAME}:rl:refresh:auth`,
    { prod: 15, dev: 10 },
    1 * 60, // menit
    2 // menit block
)
// 2 req / 1 menit / IP
const authEmailSendLimiter = createLimiter(
    `${config.APP_NAME}:rl:email:send:auth`,
    { prod: 2, dev: 10 },
    1 * 60, // menit
    1 // menit block
)
// 5 req / 5 menit / IP
const authEmailVerifLimiter = createLimiter(
    `${config.APP_NAME}:rl:email:verif:auth`,
    { prod: 5, dev: 10 },
    5 * 60, // mwnit
    1 // menit block
)
// 2 req / 5 menit / IP
const authPhoneSendLimiter = createLimiter(
    `${config.APP_NAME}:rl:phone:send:auth`,
    { prod: 2, dev: 10 },
    5 * 60,  // 5 menit
    5        // block 5 menit setelah exceed
)
// 5 req / 5 menit / IP — brute force OTP 6 digit
const authPhoneVerifLimiter = createLimiter(
    `${config.APP_NAME}:rl:phone:verif:auth`,
    { prod: 5, dev: 10 },
    5 * 60,  // 5 menit
    10       // block 10 menit setelah exceed — lebih panjang karena brute force risk
)


// Private GET: 100 req / 1 menit / userId
const privateReadLimiter = createLimiter(
    `${config.APP_NAME}:rl:r:private`,
    { prod: 100, dev: 100 },
    1 * 60,
    1 // menit block
)
// Private POST PUT PATCH DELETE: 30 req / 1 menit / userId
const privateCUDLimiter = createLimiter(
    `${config.APP_NAME}:rl:cud:private`,
    { prod: 30, dev: 30 },
    1 * 60,
    1 // menit
)

// THIRD PARTY
//Geocoding
const geocodingLimiter = createLimiter(
    `${config.APP_NAME}:rl:geocoding:private`,
    { prod: 20, dev: 20 },
    1 * 60,  // 1 menit
    2        // block 2 menit setelah exceed
)


const createMiddleware = (
    limiter: RateLimiterAbstract,
    keyFn: (req: Request) => string,
    errorMessage: string
) => async (req: Request, res: Response, next: NextFunction) => {
    if (isTest) return next()

    try {
        const result = await limiter.consume(keyFn(req))

        res.set('RateLimit-Limit', String(limiter.points))
        res.set('RateLimit-Remaining', String(result.remainingPoints))
        res.set('RateLimit-Reset', String(Math.ceil((Date.now() + result.msBeforeNext) / 1000)))

        next()
    } catch (rejRes) {
        const result = rejRes as RateLimiterRes
        const retryAfter = Math.ceil(result.msBeforeNext / 1000)

        securityLogger.rateLimitExceeded(
            req.ip ?? 'unknown',
            (req as any).user?.id ?? null,
            req.originalUrl,
            (req as any).requestId
        )
        
        res.set('Retry-After', String(retryAfter))
        res.set('RateLimit-Limit', String(limiter.points))
        res.set('RateLimit-Remaining', '0')
        res.set('RateLimit-Reset', String(Math.ceil((Date.now() + result.msBeforeNext) / 1000)))

        res.status(429).json({
            success: false,
            message: "Too many requests",
            errors: errorMessage,
            retryAfter
        })
    }
}

// OWASP A04 - Insecure Design
// Untuk semua endpoint public (by IP)
export const publicRateLimit = createMiddleware(
    publicLimiter,
    (req) => req.ip || 'ip:unknown',
    "Rate limit exceeded, please try again in  1 minutes"
)

// OWASP A04 - Insecure Design
// Untuk endpoint auth (by IP)
export const authLoginRateLimiter = createMiddleware(
    authLoginLimiter,
    (req) => req.ip || 'ip:unknown',
    "Too many attempts, please try again in 2 minutes"
)
export const authRegisterRateLimiter = createMiddleware(
    authRegisterLimiter,
    (req) => req.ip || 'ip:unknown',
    "Too many attempts, please try again in 1 minutes"
)
export const authRefreshRateLimiter = createMiddleware(
    authRefreshLimiter,
    (req) => req.ip || 'ip:unknown',
    "Too many attempts, please try again in 1 minutes"
)
export const authEmailSendRateLimiter = createMiddleware(
    authEmailSendLimiter,
    (req) => req.ip || 'ip:unknown',
    "Too many attempts, please try again in 1 minutes"
)
export const authEmailVerifRateLimiter = createMiddleware(
    authEmailVerifLimiter,
    (req) => req.ip || 'ip:unknown',
    "Too many attempts, please try again in 1 minutes"
)
export const authPhoneSendRateLimiter = createMiddleware(
    authPhoneSendLimiter,
    (req) => req.ip || 'ip:unknown',
    "Too many attempts, please try again in 5 minutes"
)
export const authPhoneVerifRateLimiter = createMiddleware(
    authPhoneVerifLimiter,
    (req) => req.ip || 'ip:unknown',
    "Too many attempts, please try again in 10 minutes"
)

// OWASP A04 - Insecure Design
// Untuk semua endpoint private (by userId)
export const privateReadRateLimit = createMiddleware(
    privateReadLimiter,
    (req) => {
        const userId = (req as any).user?.id
        const ip = req.ip
        return userId ? `user:${userId}` : `ip:${ip}`
    },
    "Rate limit exceeded, please try again in 1 minutes"
)
export const privateCUDRateLimit = createMiddleware(
    privateCUDLimiter,
    (req) => {
        const userId = (req as any).user?.id
        const ip = req.ip
        return userId ? `user:${userId}` : `ip:${ip}`
    },
    "Rate limit exceeded, please try again in 1 minutes"
)

//THIRD PARTY
//Geocoding
export const geocodingRateLimit = createMiddleware(
    geocodingLimiter,
    (req) => {
        const userId = (req as any).user?.id
        const ip = req.ip
        return userId ? `user:${userId}` : `ip:${ip}`
    },
    "Too many requests, please try again in 2 minutes"
)

// ================================
// HELMET — HTTP Security Headers
// ================================
// Helmet mengatur HTTP headers untuk mencegah serangan:
// - X-Content-Type-Options: mencegah MIME sniffing
// - X-Frame-Options: mencegah clickjacking
// - Strict-Transport-Security: paksa HTTPS
// - Content-Security-Policy: batasi sumber konten
// - X-XSS-Protection: proteksi XSS di browser lama
export const helmetGuard = isProd
    ? helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'", "'unsafe-inline'", "https:"],
                styleSrc: ["'self'", "'unsafe-inline'", "https:"],
                imgSrc: ["'self'", "data:", "https:"],
                connectSrc: ["'self'"],
                fontSrc: ["'self'"],
                objectSrc: ["'none'"],
                mediaSrc: ["'self'"],
                frameSrc: ["'none'"]
            }
        },
        crossOriginEmbedderPolicy: true,
        crossOriginOpenerPolicy: true,
        crossOriginResourcePolicy: { policy: "same-site" },
        dnsPrefetchControl: { allow: false },
        frameguard: { action: "deny" },
        hidePoweredBy: true,
        hsts: {
            maxAge: 31536000,
            includeSubDomains: true,
            preload: true
        },
        ieNoOpen: true,
        noSniff: true,
        referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    })
    : helmet({
        contentSecurityPolicy: false,
        crossOriginEmbedderPolicy: false,
        hsts: false
    })

// ================================
// CSRF PROTECTION
// ================================
// CSRF (Cross-Site Request Forgery) — attacker membuat user
// yang sudah login melakukan aksi tanpa sadar.
// Contoh: user buka website jahat, website itu kirim request
// ke API kamu menggunakan cookie session user.
//
// Untuk REST API yang pakai JWT di Authorization header,
// CSRF tidak terlalu relevan karena:
// - Browser tidak otomatis kirim Authorization header
// - Cookie tidak dipakai untuk auth
// Tapi kalau pakai cookie untuk refresh token, perlu CSRF token.
// - jika memakai cookies = lax | strict csrf tidak perlu
export const csrfProtection = (req: Request, res: Response, next: NextFunction) => {
    if (isDev || isTest) return next()
    // Skip untuk GET, HEAD, OPTIONS (safe methods)
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next()

    if (req.headers.authorization?.startsWith('Bearer ')) return next()
    // Kalau sameSite strict/lax, skip CSRF karena sudah aman
    if (config.SAMESITE_COOKIES === 'strict' || config.SAMESITE_COOKIES === 'lax') return next()

    const csrfToken = Array.isArray(req.headers['x-csrf-token'])
        ? req.headers['x-csrf-token'][0]
        : req.headers['x-csrf-token']

    const sessionCsrf = (req as any).session?.csrfToken

    if (!csrfToken || csrfToken !== sessionCsrf) {
        return res.status(403).json({
            success: false,
            message: "forbidden",
            errors: "Invalid CSRF token"
        })
    }

    next()
}

// ================================
// XSS PROTECTION 
// OWASP A03 - Injection =  sanitasi input using library xss
// ================================
// XSS (Cross-Site Scripting) — attacker inject script berbahaya
// ke dalam konten yang ditampilkan ke user lain.
// Contoh: user input "<script>steal(document.cookie)</script>"
// sebagai nama, lalu ditampilkan ke user lain tanpa sanitasi.
//
// Cara kerja sanitizer: strip atau escape karakter berbahaya
// dari input sebelum disimpan ke DB.
// export const xssProtection = (req: Request, res: Response, next: NextFunction) => {
//     if (req.body) {
//         req.body = sanitizeObject(req.body)
//     }
//     if (req.query) {
//         req.query = sanitizeObject(req.query) as any
//     }
//     next()
// }

export const xssProtection = (req: Request, res: Response, next: NextFunction) => {
    if (req.body) {
        req.body = sanitizeObject(req.body)
    }
    if (req.query) {
        // Override via defineProperty kompatibel Express 4 & 5
        Object.defineProperty(req, 'query', {
            value: sanitizeObject(req.query),
            writable: true,
            configurable: true,
            enumerable: true
        })
    }
    next()
}

function sanitizeString(str: string): string {
    return filterXSS(str, {
        whiteList: {}, // tidak ada tag HTML yang diizinkan
        stripIgnoreTag: true, // hapus tag yang tidak ada di whitelist
        stripIgnoreTagBody: ['script', 'style'] // hapus isi script dan style
    })
}

function sanitizeObject(obj: any): any {
    if (typeof obj === 'string') return sanitizeString(obj)
    if (Array.isArray(obj)) return obj.map(sanitizeObject)
    if (obj !== null && typeof obj === 'object') {
        return Object.fromEntries(
            Object.entries(obj).map(([k, v]) => [k, sanitizeObject(v)])
        )
    }
    return obj
}

// ================================
// HPP - HTTP Parameter Pollution
// OWASP A03 - Injection = prevent HTTP parameter pollution
// ================================
// to protect against HTTP Parameter Pollution attacks
// ex: /search?firstName=Jhon&firstName=Jhon
export const hppMiddleware = hpp()