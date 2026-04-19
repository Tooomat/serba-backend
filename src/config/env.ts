import dotenv from 'dotenv'
import path from 'path'
import type { StringValue } from "ms"

const NODE_ENV = process.env.NODE_ENV || ""

const isDocker = process.env.DOCKER === 'true'

const envFileMap: Record<string, string> = {
  development: isDocker ? '.env.development.docker' : '.env.development.local',
  production: '.env',
  test: isDocker ? '.env.test.docker' : '.env.test.local',
}

dotenv.config({
  path: path.join(process.cwd(), envFileMap[NODE_ENV] || '.env'),
})

export interface EnvConfig {
  NODE_ENV: 'development' | 'production' | 'test'
  APP_PORT: number
  APP_NAME: string
  APP_URL: string

  FRONTEND_URL: string

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

  HTTPONLY_COOKIES: boolean
  SECURE_COOKIES: boolean
  SAMESITE_COOKIES: boolean | "lax" | "strict" | "none" | undefined
  PATH_COOKIES: string

  CORS_ORIGIN: string

  REDIS_HOST: string
  REDIS_PORT: number
  REDIS_PASSWORD: string
  REDIS_DB: number

  CLOUDINARY_CLOUD_NAME: string
  CLOUDINARY_API_KEY: string
  CLOUDINARY_API_SECRET: string

  RESEND_API_KEY: string

  GOOGLE_CLIENT_ID: string
  GOOGLE_CLIENT_SECRET: string
  GOOGLE_REDIRECT_URL: string

  JWT_OAUTH_STATE_SECRET: string
  JWT_OAUTH_STATE_EXPIRE: string
}

function required(key: string): string {
  const value = process.env[key]
  if (!value) {
    throw new Error(`ENV ${key} is required`)
  }
  return value
}

function parseSameSite(value: string | undefined): "lax" | "strict" | "none" {
  const normalized = value?.toLowerCase()
  if (normalized === "lax" || normalized === "strict" || normalized === "none") {
    return normalized
  }
  return "strict"
}

function parseBoolean(value: string | undefined, defaultValue: boolean = false): boolean {
  if (!value) return defaultValue
  return value.toLowerCase() === 'true' || value === '1'
}

export const config: EnvConfig = {
  NODE_ENV: NODE_ENV as EnvConfig['NODE_ENV'],
  APP_PORT: Number(process.env.APP_PORT || 3000),
  APP_URL: required("APP_URL"),
  APP_NAME: required("APP_NAME"),

  FRONTEND_URL: required("FRONTEND_URL"),

  DATABASE_URL: required('DATABASE_URL'),
  DB_HOST: required("DB_HOST"),
  DB_USER: required("DB_USER"),
  DB_PORT: Number(process.env.DB_PORT || 3306),
  DB_PASSWORD: process.env.DB_PASSWORD || "",
  DB_NAME: required("DB_NAME"),

  JWT_REFRESH_SECRET: 
    NODE_ENV === 'production'
      ? required('JWT_REFRESH_SECRET')
      : process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret',
  JWT_REFRESH_EXPIRE: (process.env.JWT_REFRESH_EXPIRE || '7d') as StringValue,
  
  JWT_ACCESS_SECRET: 
    NODE_ENV === 'production'
      ? required('JWT_ACCESS_SECRET')
      : process.env.JWT_ACCESS_SECRET || 'dev-access-secret',
  JWT_ACCESS_EXPIRE: (process.env.JWT_ACCESS_EXPIRE || '1d') as StringValue,

  LOG_LEVEL: process.env.LOG_LEVEL || 'info',

  HTTPONLY_COOKIES: parseBoolean(process.env.HTTPONLY_COOKIES),
  SECURE_COOKIES: parseBoolean(process.env.SECURE_COOKIES),
  SAMESITE_COOKIES: parseSameSite(process.env.SAMESITE_COOKIES),
  PATH_COOKIES: process.env.PATH_COOKIES || '/',

  CORS_ORIGIN: process.env.CORS_ORIGIN || "",

  REDIS_HOST: required("REDIS_HOST"),
  REDIS_PORT: Number(process.env.REDIS_PORT || 6379),
  REDIS_PASSWORD: required("REDIS_PASSWORD"),
  REDIS_DB: Number(process.env.REDIS_DB || 0),

  CLOUDINARY_CLOUD_NAME: required("CLOUDINARY_CLOUD_NAME"),
  CLOUDINARY_API_KEY: required("CLOUDINARY_API_KEY"),
  CLOUDINARY_API_SECRET: required("CLOUDINARY_API_SECRET"),

  RESEND_API_KEY: required("RESEND_API_KEY"),

  GOOGLE_CLIENT_ID: required("GOOGLE_CLIENT_ID"),
  GOOGLE_CLIENT_SECRET: required("GOOGLE_CLIENT_SECRET"),
  GOOGLE_REDIRECT_URL: required("GOOGLE_REDIRECT_URL"),

  JWT_OAUTH_STATE_SECRET: required("JWT_OAUTH_STATE_SECRET"),
  JWT_OAUTH_STATE_EXPIRE: required("JWT_OAUTH_STATE_EXPIRE"),
}
