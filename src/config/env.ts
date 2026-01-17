import dotenv from 'dotenv'
import path from 'path'
import type { StringValue } from "ms"

const NODE_ENV = process.env.NODE_ENV || ""

const envFileMap: Record<string, string> = {
  development: '.env.development',
  production: '.env.production',
  test: '.env.test',
}

dotenv.config({
  path: path.join(process.cwd(), envFileMap[NODE_ENV] || '.env'),
})

export interface EnvConfig {
  NODE_ENV: 'development' | 'production' | 'test'
  APP_PORT: number
  APP_URL: string

  DATABASE_URL: string
  DB_HOST: string
  DB_USER: string
  DB_PORT: number
  DB_PASSWORD: string
  DB_NAME: string

  JWT_REFRESH_SECRET: string
  JWT_REFRESH_EXPIRE: string

  JWT_ACCESS_SECRET: string
  JWT_ACCESS_EXPIRE: string

  LOG_LEVEL: string

  CORS_ORIGIN: string

  REDIS_HOST: string
  REDIS_PORT: number
  REDIS_PASSWORD: string
  REDIS_DB: number
}

function required(key: string): string {
  const value = process.env[key]
  if (!value) {
    throw new Error(`ENV ${key} is required`)
  }
  return value
}

export const config: EnvConfig = {
  NODE_ENV: NODE_ENV as EnvConfig['NODE_ENV'],
  APP_PORT: Number(process.env.APP_PORT || 3000),
  APP_URL: required("APP_URL"),

  DATABASE_URL: required('DATABASE_URL'),
  DB_HOST: required("DB_HOST"),
  DB_USER: required("DB_USER"),
  DB_PORT: Number(process.env.DB_PORT || 3306),
  DB_PASSWORD: process.env.DB_PASSWORD || "",
  DB_NAME: required("DB_NAME"),

  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET!,
  JWT_REFRESH_EXPIRE: process.env.JWT_REFRESH_EXPIRE as StringValue,
  
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET!,
  JWT_ACCESS_EXPIRE: process.env.JWT_ACCESS_EXPIRE as StringValue,

  LOG_LEVEL: process.env.LOG_LEVEL || 'info',

  CORS_ORIGIN: process.env.CORS_ORIGIN || "",

  REDIS_HOST: required("REDIS_HOST"),
  REDIS_PORT: Number(process.env.REDIS_PORT || 6379),
  REDIS_PASSWORD: required("REDIS_PASSWORD"),
  REDIS_DB: Number(process.env.REDIS_DB || 0),
}
