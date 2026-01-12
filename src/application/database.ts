import * as env from "../config/env"
import { PrismaPg } from '@prisma/adapter-pg'
// import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import { PrismaClient } from '../generated/prisma/client'
import { logger } from "./logging";

const isDev = env.config.NODE_ENV === "development";
const connectionString = `${env.config.DATABASE_URL}`

// use this if database using MYSQL
// const adapter = new PrismaMariaDb({ 
//   host: env.config.DB_HOST,
//   port: env.config.DB_PORT,
//   user: env.config.DB_USER,
//   password: env.config.DB_PASSWORD,
//   database: env.config.DB_NAME,
// })

// use this if database using POSTGRES
const adapter = new PrismaPg({ 
  connectionString 
})

export const prismaClient = new PrismaClient({ 
    adapter,
    log: [ //apa saja yang dilog
        { 
            emit: 'event', 
            level: 'error' 
        },
        { 
            emit: 'event', 
            level: 'info' 
        },
        { 
            emit: 'event', 
            level: 'warn' 
        },
        ...(isDev ? [
            { 
                emit: 'event', 
                level: 'query' 
            } as const
        ] : [])
    ]
 })

prismaClient.$on("error", (e) => {
    logger.error({
        type: "error:prisma",
        message: e.message,
        target: e.target
    })
})

prismaClient.$on("warn", (e) => {
  logger.warn({
    type: "prisma:warn",
    message: e.message
  })
})

prismaClient.$on("info", (e) => {
  logger.info({
    type: "prisma:info",
    message: e.message
  })
})

prismaClient.$on("query", (e) => {
  logger.debug({
    type: "prisma:query",
    query: e.query,
    params: e.params,
    duration: `${e.duration}ms`
  })
})