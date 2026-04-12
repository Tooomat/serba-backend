# Node.js TypeScript REST API Template

Template backend REST API berbasis **Node.js + TypeScript** dengan **clean arsitektur layer-based Monolith** (controller–service–model–database), siap untuk **development, testing, dan production** menggunakan **Docker**.

---

## Daftar Isi

- [Tech Stack](#tech-stack)
- [Arsitektur Proyek](#arsitektur-proyek)
- [Struktur Folder](#struktur-folder)
- [Prerequisites](#prerequisites)
- [Setup & Run (Local)](#setup--run-local)
- [Running with Docker](#running-with-docker)
- [Environment Variables](#environment-variables)
- [Prisma & Database](#prisma--database)
- [Testing](#testing)
- [Membuat Fitur Baru](#membuat-fitur-baru-guideline)
- [Security Features](#security-features)
- [API Response Format](#api-response-format)
- [Scripts Reference](#scripts-reference)

---

## Tech Stack

| Kategori | Library |
|---|---|
| Language | TypeScript |
| HTTP Framework | Express v5 |
| ORM | Prisma |
| Database | PostgreSQL (bisa diganti MySQL/MariaDB) |
| Cache / Rate Limiter | Redis + ioredis + rate-limiter-flexible |
| Validation | Zod |
| Logging | Winston |
| Security | Helmet, CORS, HPP, XSS |
| Testing | Jest + Babel + Supertest |
| Password Hashing | bcrypt |
| Cloud Storage | Claudinary |


---


## OWASP (Open Web Application Security Project)

A01 - Broken Access Control (User bisa akses resource yang bukan haknya)
- AuthMiddleware.checkAuthorization — cek token setiap request
- user.status === 'BLOCKED' — cek status user
- jobApplication.job.jobProviderId !== jobProviderId — cek owner di service
- review.reviewerId !== userId — cek owner review
- isWorker && isProvider — cek keterlibatan user di job
- job.jobProviderId === workerId — cegah apply job sendiri


A02 - Cryptographic Failures (Data sensitif tidak dienkripsi dengan benar)
- bcrypt.hash(validation.password, 10) — hash password
- JWT.generateAccessToken — access token pakai JWT
- JWT.generateRefreshToken — refresh token pakai JWT
- httpOnly: true cookie untuk refresh token — cegah XSS ambil token
- blacklistAccessToken — invalidate token saat logout


A03 - Injection (Attacker inject kode berbahaya ke query/command)
- Prisma ORM — otomatis prevent SQL injection
- Zod validation di setiap request — validasi input
- xssProtection middleware — sanitasi input pakai library xss
- hppMiddleware — prevent HTTP parameter pollution


A04 - Insecure Design (Arsitektur aplikasi tidak aman dari awal)
- publicRateLimit — 100 req/15 menit per IP
- authRateLimit — 10 req/15 menit per IP untuk login/register
- privateRateLimit — 200 req/15 menit per userId
- blockDuration: 60 — block 60 detik setelah exceed
- MAX_RESEND_ATTEMPTS — limit kirim ulang OTP/verification link
- Business rules di setiap service — validasi logika bisnis


A05 - Security Misconfiguration (Konfigurasi server/aplikasi tidak aman)
- helmetGuard — security headers
- corsGuard — whitelist origin
- hidePoweredBy: true — sembunyikan X-Powered-By: Express
- hsts — paksa HTTPS di production
- frameguard: deny — cegah clickjacking
- contentSecurityPolicy — batasi sumber konten
- Error handler tidak expose stack trace di production


A06 - Vulnerable Components (Pakai library yang sudah ada celah keamanan)
- Belum ada — perlu tambahkan npm audit di CI/CD


A07 - Identification and Authentication Failures (Sistem autentikasi lemah)
- saveRefreshToken di Redis — simpan refresh token
- deleteRefreshToken — hapus refresh token saat logout
- blacklistAccessToken — blacklist access token saat logout
- isBlacklisted — cek blacklist setiap request
- JWT.verifyAccessToken — verifikasi token setiap request
- authRateLimit — limit brute force login
bcrypt.compare — verifikasi password
- isEmailVerified — cek verifikasi email sebelum login
- EmailVerificationsService — verifikasi email flow
- Token expire — access token & refresh token punya TTL


A08 - Software and Data Integrity Failures (Data atau update software tidak diverifikasi integritasnya)
- Zod validation di semua endpoint — AuthValidation, JobsValidation, JobApplicationsValidation, ReviewsValidation, dll
- Validation.validate() — wrapper validasi konsisten
- Transaction di Prisma — atomic operation untuk data integrity
- @@unique constraint di schema — prevent duplicate data


A09 - Security Logging and Monitoring Failures (Tidak ada log untuk event keamanan)
- requestLogger — log semua HTTP request/response
- securityLogger.loginSuccess — log login berhasil
- securityLogger.loginFailed — log login gagal
- securityLogger.logout — log logout
- securityLogger.accessDenied — log akses ditolak
- securityLogger.invalidToken — log token tidak valid
- securityLogger.rateLimitExceeded — log rate limit exceeded
- securityLogger.emailVerified — log verifikasi email
- ErrorHandlerMiddleware dengan logging — log semua error
- Prisma logging — log query, error, warn di development
- requestId — trace request dari masuk sampai error


A10 - Server-Side Request Forgery (SSRF) (Server melakukan request ke URL yang dikontrol attacker)
- Contoh: fitur upload dari URL, webhook URL tidak divalidasi.
Yang perlu diperhatikan: kalau nanti ada fitur upload dari URL atau webhook, perlu validasi URL tujuan


---

## Arsitektur Proyek

```
Request → Controller → Service → Prisma (Database)
                ↕
         Validation (Zod)
                ↕
         Error Handler Middleware
```

Layer yang digunakan:

- **Controller** — menerima request, memanggil service, mengembalikan response
- **Service** — business logic, validasi, interaksi dengan database
- **Model** — tipe data request/response (DTO), fungsi mapper
- **Validation** — Zod schema untuk validasi input
- **Middleware** — security, logging, error handling
- **Utils** — fungsi helper yang digunakan di banyak tempat

---

## Struktur Folder

```
├── prisma/
│   ├── schema.prisma          # Prisma schema (model database)
│   ├── migrations/            # File migrasi (di-gitignore untuk template)
│   └── seeds/
│       └── index.seeds.ts     # Seeder data awal
├── src/
│   ├── application/
│   │   ├── database.ts        # Prisma client instance
│   │   ├── logging.ts         # Winston logger instance
│   │   ├── redis.ts           # Redis client instance
│   │   └── server.ts          # Express app setup & middleware
│   ├── config/
│   │   ├── env.ts             # Environment variables config
│   │   └── redis.conf         # Redis konfigurasi
│   ├── controller/
│   │   └── example.controller.ts
│   ├── error/
│   │   └── service-response.error.ts  # Custom error class
│   ├── generated/
│   │   └── prisma/            # Auto-generated Prisma client (jangan diedit manual)
│   ├── model/
│   │   ├── page.model.ts      # Tipe Paging & Pagable untuk list endpoint
│   │   └── example/
│   │       ├── example-request.model.ts   # Request DTO
│   │       └── example-response.model.ts  # Response DTO + mapper
│   ├── service/
│   │   └── example.service.ts
│   ├── utils/
│   │   ├── formater.validation.ts   # Hash PII, mask email
│   │   ├── logging.utils.ts         # Security event logger
│   │   └── page.utils.ts            # Build paging response
│   ├── validation/
│   │   ├── example.validation.ts    # Zod schema
│   │   └── validation.ts            # Wrapper Validation.validate()
│   ├── web/
│   │   ├── http/
│   │   │   └── web-response.http.ts        # Helper fungsi response
│   │   ├── middleware/
│   │   │   ├── logging.middleware.ts        # Request/response logger
│   │   │   ├── security.middleware.ts       # CORS, rate limit, helmet, XSS, HPP
│   │   │   └── web-error-handler.middleware.ts  # Global error handler
│   │   └── route/
│   │       ├── index.ts                         # Main router
│   │       ├── public-api-registry.route.ts     # Route publik (tanpa auth)
│   │       └── private-api-registry.route.ts    # Route privat (dengan auth)
│   └── index.ts               # Entry point aplikasi
├── test/
│   └── example.test.ts
├── .env.example
├── .env.development.local     # Untuk local dev
├── .env.development.docker    # Untuk dev via Docker
├── .env.test.local            # Untuk test local
├── .env.test.docker           # Untuk test via Docker
├── docker-compose.dev.yml
├── docker-compose.test.yml
├── docker-compose.prod.yml
├── Dockerfile
├── babel.config.json
├── tsconfig.json
└── prisma.config.ts
```

---

## Prerequisites

Pastikan tools berikut sudah terinstall:

- Node.js **v20+** (sesuai engine Prisma 7)
- npm **v9+**
- Docker & Docker Compose (opsional untuk local, wajib untuk Docker workflow)
- PostgreSQL (jika tidak pakai Docker)
- Redis (jika tidak pakai Docker)

---

## Setup & Run (Local)

### 1. Clone Repository

```bash
git clone https://github.com/Tooomat/node-ts-rest-api-template.git
cd node-ts-rest-api-template
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Environment Variables

```bash
cp .env.example .env.development.local
cp .env.example .env.test.local
```

Edit file `.env.development.local` dan sesuaikan nilai berikut:

```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/DATABASE"
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=yourpassword
JWT_ACCESS_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret
APP_NAME=my-app
APP_URL=http://localhost:3000
FRONTEND_URL=http://localhost:5173
```

### 4. Prisma Generate & Migrate

```bash
# Generate Prisma client
npm run prisma:generate:dev

# Jalankan migrasi database
npm run prisma:migrate:dev
```

### 5. Seeder (opsional)

```bash
npm run prisma:seed:dev
```

### 6. Jalankan Aplikasi

```bash
npm run dev
```

Server berjalan di `http://localhost:3000`

---

## Running with Docker

### Development

**Build dan jalankan semua service (app + postgres + redis):**

```bash
docker compose -f docker-compose.dev.yml up -d --build
```

atau via npm script:

```bash
npm run dev:docker:up
```

**Prisma migrate di dalam container:**

```bash
docker exec -it app-dev npx prisma migrate dev
```

**Prisma generate di dalam container:**

```bash
docker exec -it app-dev npx prisma generate
```

**Seeder:**

```bash
docker exec app-dev npm run prisma:seed:dev
```

**Stop & remove container:**

```bash
npm run dev:docker:down
```

**Hapus container + volume (reset data):**

```bash
npm run dev:docker:down:volume
```

---

### Testing

```bash
docker compose -f docker-compose.test.yml up --abort-on-container-exit
```

Atau via npm:

```bash
npm run test:docker:up
```

Proses ini akan otomatis:
1. Menjalankan Postgres & Redis container khusus test
2. Menjalankan Prisma migrate
3. Menjalankan seeder test (jika dikonfigurasi)
4. Menjalankan Jest test suite
5. Stop semua container setelah selesai

**Hapus volume test:**

```bash
npm run test:docker:down:volume
```

---

### Production

**Build dan jalankan:**

```bash
cp .env.example .env
# Edit .env sesuai environment production

docker compose --env-file .env -f docker-compose.prod.yml up -d
```

**Cek status:**

```bash
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f app
```

**Jalankan migrasi production:**

```bash
docker compose -f docker-compose.prod.yml exec app npx prisma migrate deploy
```

**Update deployment:**

```bash
git pull
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d
docker compose -f docker-compose.prod.yml exec app npx prisma migrate deploy
```

---

## Environment Variables

| Variable | Keterangan | Contoh |
|---|---|---|
| `NODE_ENV` | Environment mode | `development` / `test` / `production` |
| `DOCKER` | Apakah berjalan dalam Docker | `true` / `false` |
| `APP_NAME` | Nama aplikasi (dipakai di rate limiter key) | `my-app` |
| `APP_PORT` | Port server | `3000` |
| `APP_URL` | Base URL aplikasi | `http://localhost:3000` |
| `FRONTEND_URL` | URL frontend (CORS allow) | `http://localhost:5173` |
| `DATABASE_URL` | Connection string Prisma | `postgresql://...` |
| `DB_HOST` | Host database | `localhost` |
| `DB_USER` | Username database | `postgres` |
| `DB_PORT` | Port database | `5432` |
| `DB_PASSWORD` | Password database | `secret` |
| `DB_NAME` | Nama database | `mydb` |
| `JWT_ACCESS_SECRET` | Secret untuk access token | (string panjang acak) |
| `JWT_ACCESS_EXPIRE` | Masa berlaku access token | `1h` |
| `JWT_REFRESH_SECRET` | Secret untuk refresh token | (string panjang acak) |
| `JWT_REFRESH_EXPIRE` | Masa berlaku refresh token | `7d` |
| `SESSION_SECRET` | Secret untuk session | (string panjang acak, min 32 char) |
| `REDIS_HOST` | Host Redis | `localhost` |
| `REDIS_PORT` | Port Redis | `6379` |
| `REDIS_PASSWORD` | Password Redis | `secret` |
| `REDIS_DB` | Nomor database Redis | `0` |
| `CORS_ORIGIN` | Origin yang diizinkan (production) | `https://myapp.com` |
| `HTTPONLY_COOKIES` | HttpOnly flag untuk cookie | `true` |
| `SECURE_COOKIES` | Secure flag untuk cookie | `true` (production) |
| `SAMESITE_COOKIES` | SameSite policy cookie | `lax` / `strict` / `none` |

> **Catatan:** Di mode `development` dan `test`, semua origin CORS diizinkan. Di `production`, hanya yang ada di `CORS_ORIGIN` yang diizinkan.

---

## Prisma & Database

### Mengganti Database ke MySQL

1. Edit `prisma/schema.prisma`:

```prisma
datasource db {
  provider = "mysql"
}
```

2. Edit `src/application/database.ts` — ganti adapter:

```typescript
// Ganti PrismaPg dengan PrismaMariaDb
import { PrismaMariaDb } from '@prisma/adapter-mariadb'

const adapter = new PrismaMariaDb({
  host: env.config.DB_HOST,
  port: env.config.DB_PORT,
  user: env.config.DB_USER,
  password: env.config.DB_PASSWORD,
  database: env.config.DB_NAME,
})
```

3. Update `DATABASE_URL` di `.env`:

```env
DATABASE_URL="mysql://user:password@localhost:3306/database_name"
```

### Prisma Studio (GUI Database)

```bash
npm run prisma:studio:dev
```

---

## Testing

### Jalankan Test Local

```bash
# Pastikan Postgres dan Redis test sudah berjalan
npm run prisma:migrate:test
npm run prisma:seed:test  # jika ada seeder

npm run test
```

### Jalankan Test File Tertentu

```bash
npm run test -- test/example.test.ts
```

### Menulis Test

Test file diletakkan di folder `test/` dengan ekstensi `.test.ts`.

```typescript
import supertest from "supertest"
import * as server from "../src/application/server"

describe('POST /api/example', () => {
    it('should reject if request invalid', async () => {
        const res = await supertest(server.webApp)
            .post("/api/example")
            .send({ username: "", password: "", name: "" })

        expect(res.status).toBe(400)
        expect(res.body.errors).toBeDefined()
    })

    it('should create user if request valid', async () => {
        const res = await supertest(server.webApp)
            .post("/api/example")
            .send({ username: "testuser", password: "password123", name: "Test User" })

        expect(res.status).toBe(201)
        expect(res.body.data.username).toBe("testuser")
    })
})
```

---

## Membuat Fitur Baru (Guideline)

Ikuti urutan berikut saat menambah fitur:

### 1. Update Prisma Schema

Edit `prisma/schema.prisma`, tambahkan model baru, lalu migrate:

```bash
npm run prisma:migrate:dev
npm run prisma:generate:dev
```

### 2. Buat Model (DTO)

Buat folder baru di `src/model/namafitur/`:

```
src/model/contact/
├── contact-request.model.ts   # Request DTO (CreateContactRequest, UpdateContactRequest, dll)
├── contact-response.model.ts  # Response DTO + mapper toContactResponse()
```

Contoh request model:

```typescript
// contact-request.model.ts
export type CreateContactRequest = {
    first_name: string
    last_name?: string
    email?: string
    phone?: string
}
```

Contoh response model:

```typescript
// contact-response.model.ts
import { Contact } from "../../generated/prisma/client"

export type ContactResponse = {
    id: string
    first_name: string
    last_name?: string | null
    email?: string | null
    phone?: string | null
}

export function toContactResponse(contact: Contact): ContactResponse {
    return {
        id: contact.id,
        first_name: contact.first_name,
        last_name: contact.last_name,
        email: contact.email,
        phone: contact.phone,
    }
}
```

### 3. Buat Validation (Zod)

Buat file di `src/validation/contact.validation.ts`:

```typescript
import { z } from "zod"

export class ContactValidation {
    static readonly CREATE = z.object({
        first_name: z.string().min(1).max(100),
        last_name: z.string().max(100).optional(),
        email: z.string().email().optional(),
        phone: z.string().max(20).optional(),
    })

    static readonly UPDATE = z.object({
        id: z.string().uuid(),
        first_name: z.string().min(1).max(100),
        // ...
    })
}
export type ContactRequest = z.infer<typeof ContactValidation.CREATE>;
```

### 4. Buat Service

Buat file di `src/service/contact.service.ts`:

```typescript
import { prismaClient } from "../application/database"
import { ResponseError } from "../error/service-response.error"
import { Validation } from "../validation/validation"
import { ContactValidation } from "../validation/contact.validation"
import { CreateContactRequest } from "../model/contact/contact-request.model"
import { ContactResponse, toContactResponse } from "../model/contact/contact-response.model"

export class ContactService {
    static async create(username: string, req: CreateContactRequest): Promise<ContactResponse> {
        const data = Validation.validate(ContactValidation.CREATE, req)

        const contact = await prismaClient.contact.create({
            data: { ...data, username }
        })

        return toContactResponse(contact)
    }
}
```

### 5. Buat Controller

Buat file di `src/controller/contact.controller.ts`:

```typescript
import { NextFunction, Request, Response } from "express"
import { success_handler } from "../web/http/web-response.http"
import { ContactService } from "../service/contact.service"
import { CreateContactRequest } from "../model/contact/contact-request.model"

export class ContactController {
    static async create(req: Request, res: Response, next: NextFunction) {
        try {
            const request: CreateContactRequest = req.body
            const username = (req as any).user?.username // dari auth middleware

            const result = await ContactService.create(username, request)
            return success_handler(res, "Contact created", result, 201)
        } catch (e) {
            next(e)
        }
    }
}
```

### 6. Daftarkan Route

**Public route** (tanpa login) → `src/web/route/public-api-registry.route.ts`

**Private route** (butuh login) → `src/web/route/private-api-registry.route.ts`

```typescript
// private-api-registry.route.ts
import { ContactController } from "../../controller/contact.controller"

privateRouter.post("/api/contacts", ContactController.create)
privateRouter.get("/api/contacts", ContactController.list)
privateRouter.get("/api/contacts/:id", ContactController.get)
privateRouter.put("/api/contacts/:id", ContactController.update)
privateRouter.delete("/api/contacts/:id", ContactController.remove)
```

### 7. Buat Seeder (opsional)

Edit `prisma/seeds/index.seeds.ts`:

```typescript
async function seed() {
    await seedContacts()
}
```

### 8. Tulis Test

Buat `test/contact.e2e.test.ts` dengan skenario happy path dan edge case.

### 9. Tips Paging (untuk endpoint list)

Gunakan `buildPaging()` dari `src/utils/page.utils.ts` dan type `Pagable<T>` dari `src/model/page.model.ts`:

```typescript
import { buildPaging } from "../utils/page.utils"
import { Pagable } from "../model/page.model"
import { ContactResponse } from "../model/contact/contact-response.model"

// Di service:
const total = await prismaClient.contact.count({ where })
const contacts = await prismaClient.contact.findMany({ where, skip, take })

const result: Pagable<ContactResponse> = {
    data: contacts.map(toContactResponse),
    paging: buildPaging(page, size, total)
}
return result
```

---

## Security Features

Template ini mengimplementasikan OWASP Top 10 guidelines:

| Fitur | Library | Keterangan |
|---|---|---|
| Security Headers | Helmet | X-Frame-Options, CSP, HSTS, dll |
| CORS | cors | Restrict origin di production |
| Rate Limiting | rate-limiter-flexible | Berbeda untuk public/auth/private endpoint |
| XSS Protection | xss | Sanitasi input sebelum masuk ke service |
| HTTP Parameter Pollution | hpp | Cegah duplikasi query parameter |
| Password Hashing | bcrypt | Salt 10 rounds |
| Request Logging | Winston | Log setiap request dengan requestId |
| Security Event Logging | Winston | Login success/fail, rate limit exceeded, dll |

### Rate Limit Strategy

| Endpoint | Limit | Per |
|---|---|---|
| Public | 100 req / 15 menit | IP |
| Auth (login/register) | 10 req / 15 menit | IP |
| Private (authenticated) | 200 req / 15 menit | userId |

> Di `development` dan `test`, rate limit lebih longgar secara otomatis.

---

## API Response Format

Semua response mengikuti format yang konsisten:

**Success dengan data:**

```json
{
  "success": true,
  "message": "User created",
  "data": {
    "username": "johndoe",
    "name": "John Doe"
  }
}
```

**Success tanpa data:**

```json
{
  "success": true,
  "message": "Logout successful"
}
```

**Error validasi (400):**

```json
{
  "success": false,
  "message": "Validation error",
  "errors": [
    { "path": "username", "message": "Username must be at least 1 characters" },
    { "path": "password", "message": "Password must contain at least 8 characters" }
  ]
}
```

**Error service (4xx/5xx):**

```json
{
  "success": false,
  "message": "Conflict",
  "errors": "Username already exists"
}
```

---

## Scripts Reference

```bash
# Development
npm run dev                     # Jalankan local dengan hot reload

# Docker Development
npm run dev:docker:up           # Build + jalankan Docker dev
npm run dev:docker:start        # Start container yang sudah ada
npm run dev:docker:stop         # Stop container (data tetap)
npm run dev:docker:down         # Hapus container
npm run dev:docker:down:volume  # Hapus container + volume (reset data)

# Testing
npm run test                    # Test local
npm run test:docker:up          # Test via Docker
npm run test:docker:down:volume # Hapus container test

# Build
npm run build                   # Compile TypeScript ke dist/

# Prisma (Local)
npm run prisma:generate:dev     # Generate Prisma client
npm run prisma:migrate:dev      # Buat + jalankan migrasi baru
npm run prisma:migrate:test     # Deploy migrasi ke test DB
npm run prisma:seed:dev         # Jalankan seeder development
npm run prisma:seed:test        # Jalankan seeder test
npm run prisma:studio:dev       # Buka Prisma Studio (GUI)

# Prisma (Docker)
npm run prisma:generate:dev:docker
npm run prisma:migrate:dev:docker
npm run prisma:seed:dev:docker
npm run prisma:studio:dev:docker
```

---

## Author

**Hadi Dwi Ardiansyah**

---

## License

ISC