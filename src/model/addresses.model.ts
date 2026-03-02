import { Decimal } from "@prisma/client/runtime/client"
import { Address, Mark } from "../generated/prisma/client"
import { parseJsonLocation } from "../utils/location.utils"

type locationJson = {
    subdistrict: {
        id: string
        name: string
        code: string
    },
    district: {
        id: string
        name: string
        code: string
    },
    city: {
        id: string
        name: string
        code: string
    },
    province: {
        id: string
        name: string
        code: string
    }
}

// ================================== CREATE ==================================
export type createAddressesRequest = {
    subdistrictId: string
    street: string
    postalCode: string
    benchmark?: string 
    markAs: string
    isPrimary: boolean
    lat: Decimal
    lng: Decimal
}
export type addressesResponse = {
    id: string
    street: string
    postalCode: string
    benchmark?: string | null // Bisa null dari database
    markAs: string
    lat: Decimal
    lng: Decimal
    isPrimary: boolean
    locations: locationJson
    createdAt: Date
    updatedAt?: Date | null
}

export function toAddressesResponse(address: Address): addressesResponse {
    const locations = parseJsonLocation<locationJson>(address.locations)

    return {
        id: address.id,
        street: address.street,
        postalCode: address.postalCode,
        benchmark: address.benchmark,
        markAs: address.markAs === "HOME" ? "Home" : "Office",
        lat: address.lat,
        lng: address.lng,
        isPrimary: address.isPrimary,
        locations: locations,
        createdAt: address.createdAt,
        updatedAt: address.updatedAt
    }
}

// ================================== UPDATE  ==================================
export type updateAddressRequest = {
    subdistrictId?: string
    street?: string
    postalCode?: string
    benchmark?: string
    markAs?: string
    lat?: Decimal
    lng?: Decimal
    isPrimary?: boolean
}