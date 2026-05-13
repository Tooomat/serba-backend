import { z } from "zod";

export class GeocodingValidation {
    static readonly SEARCH_SCHEMA = z.object({
        street: z
            .string()
            .min(3, "Street must be at least 3 characters")
            .max(200, "Street must be at most 200 characters")
            .trim()
            .optional(),
        postalCode: z
            .string()
            .trim()
            .regex(/^[0-9]{5}$/, "Postal code must be exactly 5 digits")
            .optional(),
        subDistrict: z
            .string()
            .trim()
            .optional(),
        district: z
            .string()
            .trim()
            .optional(),
        city: z
            .string()
            .trim()
            .optional(),
        province: z
            .string()
            .trim()
            .optional(),
    }).refine(data => Object.values(data).some(val => val !== undefined && val !== ""), {
        message: "At least one field must be provided"
    })
}

export type GeocodingSearchRequest = z.infer<typeof GeocodingValidation.SEARCH_SCHEMA>