# Teach stack
- Language: Typescript
- ORM : Prisma
- Database : MySQL
- Cache : Redis
- Validation : Zod
- HTTP Framework : Express
- Logging : Winston
- Test : Babel, Jest, dan supertest

# STEPS TO RUN LOCALLY
1. Clone Repository

```
git clone https://github.com/Tooomat/node-ts-rest-api-template.git
```

2. install dependencies:

```
npm install
```

3. Configure Environment Variables

```
cp .env.example .env.development

```
change .env value and db url in .env 

4. Run Prisma Migration (Local DB)

```
npx prisma migrate dev

or with npm:

npm run prisma:migrate:dev

```

generate schema
```
npx prisma generate

or with npm:

npm run prisma:generate

```

# Running the app with DOCKER
- *DEVELOPMENT*
```
docker compose --env-file .env.development -f docker-compose.dev.yml up -d --build

```
or simply:

```bash
docker compose -f docker-compose.dev.yml up -d --build

```

or with npm:
```
npm run dev:docker:up
```

 -> migrate prisma to docker (DEV)
```
docker exec -it app-dev npx prisma migrate dev

```

for delete use npm down:
```
npm run dev:docker:down
```

`! drop data` with npm down + volume:
```
npm run dev:docker:down:volume
```

- *TEST (JEST + PRISMA)*
```
docker compose --env-file .env.test -f docker-compose.test.yml up --abort-on-container-exit

```
    This will:
    - Start test database & Redis
    - Run Prisma migration
    - Execute Jest tests
    - Stop containers automatically

or with npm:
```
npm run test:docker:up
```

for delete volume use npm down volume:
```
npm run test:docker:down:volume
```

- *PRODUCTION - BUILD & RUN (Docker)*
1. Build image
```
docker build -t serba-backend:latest .
```

2. Run container
```
docker run -d --name serba-backend --env-file .env.production -p 8080:8080 serba-backend:latest
```

- *PRODUCTION - VIA DOCKER COMPOSE (SERVER)*
```
docker compose --env-file .env.production -f docker-compose.prod.yml up -d

```
or simply:
```bash
docker compose -f docker-compose.prod.yml up -d

```

# Running the app without DOCKER (YOU HAVE TO CHANGE ENV FILE)

1. Development (Hot Reload)

```
npm run dev
```

2. Production Build

```
npm run build
npm run start
```

3. test file
```
npm run test

or with spesifik file:

test/auth.login.test.ts
```

# Creating new feature (LOCAL)
1. Initialize Database (First Time Only)
```
npx prisma migrate dev --name init


npx prisma generate
```

- Update Prisma Schema
migrate schema with command:
```
npx prisma migrate dev
```

- create model on `/model` folder 

- Create validation for that model (for create and update if any) on `/validation` folder

- Create the service layer on `/service`

- Link it into controller in `/controller`

- Create new routes file instance at `/route/public` if user dont need login or `/route/private` if user need login , for example user.route.ts

- Register the routes into public and private registry (`route/public-api-registry.route.ts` and `route/private-api-registry.route.ts`)
