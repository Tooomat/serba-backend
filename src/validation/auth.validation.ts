import { z } from "zod";

export class AuthValidation {
    static readonly REGISTERSCHEMA = z.object({
        username: z
            .string()
            .min(1, 'Username must be at least 1 characters')
            .max(100),
        email: z
            .string()
            .email()
            .min(1, 'email must be at least 1 characters')
            .max(100),
        password: z
            .string()
            .min(8, 'Password must contain at least 8 characters')
            .max(100),
        profilePictUrl: z
            .string()
            .max(255)
            .optional(),
        firstName: z
            .string()
            .min(1, 'first name must contain at least 1 characters')
            .max(50),
        lastName: z
            .string()
            .max(100)
            .optional(),
        birthDate: z
            .string()
            .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
            .refine((dateStr) => {
                const date = new Date(dateStr)

                if (isNaN(date.getTime())) return false

                // Format kembali ke YYYY-MM-DD
                const formatted =
                    date.getFullYear().toString().padStart(4, "0") +
                    "-" +
                    (date.getMonth() + 1).toString().padStart(2, "0") +
                    "-" +
                    date.getDate().toString().padStart(2, "0")

                return formatted === dateStr
            }, "Invalid date")
            .refine((dateStr) => {
                const date = new Date(dateStr)
                const today = new Date()
                today.setHours(0, 0, 0, 0) 
                return date < today
            }, "Birth date cannot be in the future")
            .refine((dateStr) => {
                const date = new Date(dateStr)
                const minDate = new Date('1900-01-01')
                return date >= minDate
            }, "Birth date must be after 1900")
            .refine((dateStr) => {
                const date = new Date(dateStr)
                const age = Math.floor((Date.now() - date.getTime()) / (365.25 * 24 * 60 * 60 * 1000))
                return age >= 15 
            }, "You must be at least 15 years old to register")
            .transform((str) => new Date(str)),
        phone: z
            .string()
            .min(1, "Phone number is required")
            .transform((val) => val.trim().replace(/[\s\-]/g, ""))
            .refine(
                (val) => val.startsWith("+62"),
                { message: "Phone number must start with +62" }
            )
            .refine(
                (val) => /^\+62\d{9,12}$/.test(val),
                { message: "Phone number must have 9-12 digits after +62" }
            ),
    }) 

    static readonly LOGINSCHEMA = z.object({
        usernameOrEmail: z
            .string()
            .max(100),
        password: z
            .string()
            .max(100), 
    })
}

export type RegisterRequest = z.infer<typeof AuthValidation.REGISTERSCHEMA>
export type LoginRequest = z.infer<typeof AuthValidation.LOGINSCHEMA>