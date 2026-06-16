import z from "zod";

export class UsersValidation {
    static readonly UPDATE_SCHEMA = z.object({
        username: z
            .string()
            .min(1, 'Username must be at least 1 characters')
            .max(100)
            .optional(),
        firstName: z
            .string()
            .min(1, 'first name must contain at least 1 characters')
            .max(50)
            .optional(),
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
            .transform((str) => new Date(str))
            .optional(),
    })
}

export type UpdateRequest = z.infer<typeof UsersValidation.UPDATE_SCHEMA>