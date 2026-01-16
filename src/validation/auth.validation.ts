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
            .optional()
            .nullable()
            .default(null),
        firstName: z
            .string()
            .min(1, 'first name must contain at least 1 characters')
            .max(50),
        lastName: z
            .string()
            .max(100)
            .optional()
            .nullable()
            .default(null),
        birthDate: z
            .string()
            .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
            .transform((str) => new Date(str))
            .refine((date) => date <= new Date(), {
                message: "Birth date cannot be in the future"
            }),
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
}

export type RegisterRequest = z.infer<typeof AuthValidation.REGISTERSCHEMA>