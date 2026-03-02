import { Decimal } from "@prisma/client/runtime/client";
import { z } from "zod";
import { Mark } from "../generated/prisma/enums";

export class AddressesValidation {
    static readonly CREATE_SCHEMA = z.object({
        subdistrictId: z
            .string(),
        street: z
            .string()
            .min(1, 'street must be at least 1 characters'),
        postalCode: z
            .string()
            .trim()
            .regex(/^[0-9]{5}$/, "Postal code must be exactly 5 digits"),
        benchmark: z
            .string()
            .optional(),
        markAs: z
            .string()
            .toLowerCase()
            .refine((val) => ["home", "office"].includes(val), {
                message: "mark as must be either Home or Office"
            })
            .transform(val => val === "home" ? Mark.HOME : Mark.OFFICE),
        isPrimary: z
            .coerce
            .boolean(),
        lat: z 
            .string()
            .regex(/^-?\d{1,3}(\.\d{1,7})?$/, "Invalid latitude format")
            .refine(val => {
                const num = parseFloat(val)
                return num >= -90 && num <= 90
            }, "Latitude must be between -90 and 90")
            .transform(val => new Decimal(val)),
        lng: z
            .string()
            .regex(/^-?\d{1,3}(\.\d{1,7})?$/, "Invalid longitude format")
            .refine(val => {
                const num = parseFloat(val)
                return num >= -180 && num <= 180
            }, "longtitude must be between -90 and 90")
            .transform(val => new Decimal(val)),
    })

    static readonly UPDATE_ADDRESS_SCHEMA = z.object({
        subdistrictId: z
            .string()
            .optional(),
        street: z
            .string()
            .optional(),
        postalCode: z
            .string()
            .trim()
            .regex(/^[0-9]{5}$/, "Postal code must be exactly 5 digits")
            .optional(),
        benchmark: z
            .string()
            .optional(),
        markAs: z
            .string()
            .toLowerCase()
            .refine((val) => ["home", "office"].includes(val), {
                message: "mark as must be either Home or Office"
            })
            .transform(val => val === "home" ? Mark.HOME : Mark.OFFICE)
            .optional(),
        isPrimary: z
            .coerce
            .boolean()
            .optional(),
        lat: z 
            .string()
            .regex(/^-?\d{1,3}(\.\d{1,7})?$/, "Invalid latitude format")
            .refine(val => {
                const num = parseFloat(val)
                return num >= -90 && num <= 90
            }, "Latitude must be between -90 and 90")
            .transform(val => new Decimal(val))
            .optional(),
        lng: z
            .string()
            .regex(/^-?\d{1,3}(\.\d{1,7})?$/, "Invalid longtitude format")
            .refine(val => {
                const num = parseFloat(val)
                return num >= -180 && num <= 180
            }, "longtitude must be between -90 and 90")
            .transform(val => new Decimal(val))
            .optional(),
    })

}

export type CreateAddressesRequest = z.infer<typeof AddressesValidation.CREATE_SCHEMA>
export type UpdateAddressesRequest = z.infer<typeof AddressesValidation.UPDATE_ADDRESS_SCHEMA>