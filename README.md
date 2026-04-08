# Node.js TypeScript REST API Template

Template backend REST API berbasis **Node.js + TypeScript** dengan **clean arsitektur layer-based Monolith**(controller–service–repository/model-database), siap untuk **development, testing, dan production** menggunakan **Docker**.

---

## Tech Stack

* **Language**: TypeScript
* **HTTP Framework**: Express
* **ORM**: Prisma
* **Database**: Postgres
* **Cache & Queue**: Redis
* **Validation**: Zod
* **Logging**: Winston
* **Testing**: Jest, Babel, Supertest
* **Cloud storage**: Cloudinary

---

## Prerequisites

Pastikan tools berikut sudah terinstall:

* Node.js **v18+**
* Docker & Docker Compose
* Postgres (jika tidak pakai Docker)
* Redis (jika tidak pakai Docker)


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

## Setup & Run (LOCAL)

### 1. Clone Repository

```bash
git clone https://github.com/Tooomat/node-ts-rest-api-template.git
cd node-ts-rest-api-template
```

---

### 2. Install Dependencies

```bash
npm install
```

---

### 3. Setup Environment Variables

Salin file environment contoh:

```bash
cp .env.example .env.development.local
cp .env.example .env.test.local
cp .env.example .env
```

Lalu sesuaikan isi `.env` terutama:

* `DATABASE_URL`
* `DB_*`
* `REDIS_*`
* `JWT_*`

---

### 4. Prisma Migration (LOCAL)
 
```bash
npm run prisma:migrate:dev
npm run prisma:generate:dev
```

### 5. Seeder (LOCAL)

```bash
npm run prisma:seed:dev
```
---

### 6. Run App (LOCAL)

#### DEVELOPMENT (Hot Reload)

```bash
npm run dev
```

### Testing

- migrate and generate
```bash
npm run prisma:migrate:test
npm run prisma:generate:test
```
- seed to test
```bash
npm run prisma:seed:test
```

- run 
```bash
npm run test
```

Test file tertentu:

```bash
npm run test -- test/auth.login.test.ts
```
---

## Running with DOCKER

- **DEVELOPMENT**

#### Build Services

```bash
docker compose --env-file .env.development -f docker-compose.dev.yml up -d --build 
```

atau simple:
```bash
docker compose -f docker-compose.dev.yml up -d --build 
```

Atau via npm:
```bash
npm run dev:docker:up
```

#### Prisma migrate (DEV Docker)

```bash
docker exec -it app-dev npx prisma migrate dev
```

#### Generate Prisma
```bash
docker exec -it app-dev npx prisma generate 
```

#### Prisma seeder Dev

```bash
docker exec app-dev npm run prisma:seed:dev
```

#### Restart & Remove Container

```bash
npm run dev:docker:down
```

⚠️ **Hapus data + volume**:

```bash
npm run dev:docker:down:volume
```

#### Run Srvices
```bash
npm run dev:docker:start
```

#### Stop container

```bash
npm run dev:docker:stop
```

---

- **TESTING (Jest + Prisma + Docker)**

```bash
docker compose --env-file .env.test -f docker-compose.test.yml up --abort-on-container-exit
```

Proses ini akan:

* Menjalankan Postgres & Redis test
* Menjalankan Prisma migration
* Menjalankan Jest test
* Otomatis stop container

Via npm:

```bash
npm run test:docker:up
```

#### remove container test
```bash
npm run test:docker:down:volume
```
---

- **PRODUCTION (Docker)**

1. Build Image

```bash
docker build -t serba-backend:latest .
```
atau build version:

```bash
docker build -t serba-backend:1.0.0 .
```

2. Run Container

```bash
docker run -d --name serba-backend --env-file .env.production -p 8080:8080 --restart unless-stopped serba-backend:latest
```
--restart unless-stopped untuk:

* server reboot → container auto hidup lagi

---

### Production (Docker Compose – Server)

1. Run Services
```bash
docker compose --env-file .env.production -f docker-compose.prod.yml up -d
```

2. check status
```bash
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f app
```
3. Prisma Migration (kalau tidak otomatis)
```bash
docker compose -f docker-compose.prod.yml exec app npx prisma migrate deploy
```
4. Prisma seeder prod

```bash
docker exec -it app-prod npm run prisma:seed:prod
```

5. Restart container (tanpa hapus data)
```bash
docker compose -f docker-compose.prod.yml restart app
```

6. Update Deployment Flow
```bash
git pull
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d
docker compose -f docker-compose.prod.yml exec app npx prisma migrate deploy
```
---

## Creating New Feature (Guideline)

1. Update Prisma Schema

```bash
npx prisma migrate dev
```

2. Generate Prisma Client

```bash
npx prisma generate
```

3. Buat model di folder `/model`

4. Buat validation (Zod) di `/validation`

5. Buat service logic di `/service`

6. Buat controller di `/controller`

7. Buat route di `/route`

8. Register route ke:

* `route/public-api-registry.route.ts`
* `route/private-api-registry.route.ts`

9. Create seeder di `prisma/seeds`

10. Create security di `src/web/middleware`

11. Create config di `src/config`

12. Create Http response di `src/web/http/web-response.http.ts`

13. Create Handling Response Error di `src/web/middleware/web-error-handler.middleware.ts` dan update service response error di `src/error/service.error.ts`

14. Mengubah Postgre ke Mysql di `src/application/database.ts`

15. Update logger di `src/application/logging.ts`

16. create utils dimana pure function yang dipakai di banyak tempat di `src/utils`

17. create helper dimana pure fucntion dipakai di tempat tertentu di `src/helper`

---

## Prisma Utilities

```bash
npm run prisma:studio:dev
npm run prisma:seed:dev
npm run prisma:reset:dev
```

---

## Author

**SERBA**

---

## License

ISC
