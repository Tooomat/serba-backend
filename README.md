# Node.js TypeScript REST API Template

Template backend REST API berbasis **Node.js + TypeScript** dengan arsitektur clean (controller–service–model), siap untuk **development, testing, dan production** menggunakan **Docker**.

---

## Tech Stack

* **Language**: TypeScript
* **HTTP Framework**: Express
* **ORM**: Prisma
* **Database**: Postgres
* **Cache**: Redis
* **Validation**: Zod
* **Logging**: Winston
* **Testing**: Jest, Babel, Supertest

---

## Prerequisites

Pastikan tools berikut sudah terinstall:

* Node.js **v18+**
* Docker & Docker Compose
* Postgres (jika tidak pakai Docker)
* Redis (jika tidak pakai Docker)

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
cp .env.example .env.development
cp .env.example .env.development.docker
cp .env.example .env.test
cp .env.example .env.production
```

Lalu sesuaikan isi `.env` terutama:

* `DATABASE_URL`
* `DB_*`
* `REDIS_*`
* `JWT_*`

---

### 4. Prisma Migration (Local Database)

```bash
npx prisma migrate dev
npx prisma generate
```
 
Atau via npm script:

```bash
npm run prisma:migrate:dev
npm run prisma:generate:dev
```

---

### 5. Run App (Local)

#### Development (Hot Reload)

```bash
npm run dev
```

### Testing

```bash
npm run test
```

Test file tertentu:

```bash
npm run test -- test/auth.login.test.ts
```

#### Production (Tanpa Docker)

```bash
npm run build
npm run start
```

---

## Running with DOCKER

- DEVELOPMENT

```bash
docker compose --env-file .env.development.docker -f docker-compose.dev.yml up -d --build 
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

#### Prisma seeder Dev

```bash
docker exec app-dev npm run prisma:seed:dev

```

#### Stop & Remove Container

```bash
npm run dev:docker:down
```

⚠️ **Hapus data + volume**:

```bash
npm run dev:docker:down:volume
```

---

- TESTING (Jest + Prisma + Docker)

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

---

- PRODUCTION (Docker)

#### Build Image

```bash
docker build -t serba-backend:latest .
```

#### Run Container

```bash
docker run -d --name serba-backend --env-file .env.production -p 8080:8080 serba-backend:latest
```

---

### Production (Docker Compose – Server)

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml up -d
```

#### Prisma seeder prod

```bash
docker exec -it app-prod npm run prisma:seed:prod
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

7. Buat route:

* `/route/public` → tanpa auth
* `/route/private` → perlu auth

8. Register route ke:

* `route/public-api-registry.route.ts`
* `route/private-api-registry.route.ts`

---

## Prisma Utilities

```bash
npm run prisma:studio:dev
npm run prisma:seed:dev
npm run prisma:reset:dev
```

---

## Author

**serba**

---

## License

ISC
