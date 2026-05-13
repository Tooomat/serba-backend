import { Decimal } from "@prisma/client/runtime/client";
import { z } from "zod";
import { Mark } from "../generated/prisma/enums";

export class AddressesValidation {
    static readonly CREATE_SCHEMA = z.object({
        subdistrictId: z
            .string()
            .min(1, "Subdistrict ID is required"),  

        street: z
            .string()
            .min(1, "Street must be at least 1 characters"), 

        postalCode: z
            .string()
            .trim()
            .regex(/^[0-9]{5}$/, "Postal code must be exactly 5 digits"), 

        markAs: z
            .string()
            .toLowerCase()
            .refine((val) => ["home", "office"].includes(val), {
                message: "Mark as must be either Home or Office"
            })
            .transform(val => val === "home" ? Mark.HOME : Mark.OFFICE),  

        isPrimary: z
            .coerce
            .boolean("isPrimary must be a boolean"),  

        lat: z
            .string("Latitude is required" )  
            .regex(/^-?\d{1,3}(\.\d{1,10})?$/, "Invalid latitude format")
            .refine(val => {
                const num = parseFloat(val)
                return num >= -90 && num <= 90
            }, "Latitude must be between -90 and 90")
            .transform(val => new Decimal(val)),

        lng: z
            .string("Longitude is required" ) 
            .regex(/^-?\d{1,3}(\.\d{1,10})?$/, "Invalid longitude format")  
            .refine(val => {
                const num = parseFloat(val)
                return num >= -180 && num <= 180
            }, "Longitude must be between -180 and 180")  
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
            .boolean("isPrimary must be a boolean")
            .optional(),
        lat: z
            .string("Latitude is required" )  
            .regex(/^-?\d{1,3}(\.\d{1,10})?$/, "Invalid latitude format")
            .refine(val => {
                const num = parseFloat(val)
                return num >= -90 && num <= 90
            }, "Latitude must be between -90 and 90")
            .transform(val => new Decimal(val)),

        lng: z
            .string("Longitude is required" ) 
            .regex(/^-?\d{1,3}(\.\d{1,10})?$/, "Invalid longitude format")  
            .refine(val => {
                const num = parseFloat(val)
                return num >= -180 && num <= 180
            }, "Longitude must be between -180 and 180")  
            .transform(val => new Decimal(val)),
    })

}

export type CreateAddressesRequest = z.infer<typeof AddressesValidation.CREATE_SCHEMA>
export type UpdateAddressesRequest = z.infer<typeof AddressesValidation.UPDATE_ADDRESS_SCHEMA>