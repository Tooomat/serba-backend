import { prismaClient } from "../application/database";
import { ResponseError } from "../error/service-response.error";
import { 
    addressesResponse, 
    createAddressesRequest, 
    toAddressesResponse,
    updateAddressRequest
} from "../model/addresses.model";
import { AddressesValidation } from "../validation/addresses.validation";
import { Validation } from "../validation/validation";

export class AddressesService {
    static async create(userId: string, req: createAddressesRequest): Promise<addressesResponse> {
        const validate = Validation.validate(AddressesValidation.CREATE_SCHEMA, req)
        
        return prismaClient.$transaction(async (tx) => {
            const totalAddress = await tx.address.count({
                where: {
                    userId: userId,
                }
            })
            if (totalAddress === 0 && validate.isPrimary === false) { 
                throw new ResponseError(
                    400, 
                    "First address must be primary"
                ) 
            } 
            if (totalAddress >= 5) {
                throw new ResponseError(
                    400,
                    "create a maximum of 5 addresses"
                )
            }

            if (validate.isPrimary === true) {
                await tx.address.updateMany({
                    where: {
                        AND: [
                            { userId: userId },
                            { isPrimary: true }
                        ]
                    },
                    data: {
                        isPrimary: false
                    }
                })
            }

            const subDistrict = await tx.masterSubdistrict.findUnique({
                where: {
                    id: validate.subdistrictId
                }
            })
            if (!subDistrict) {
                throw new ResponseError(
                    404,
                    "Sub district not found"
                )
            }

            const addressData: any = {
                userId: userId,
                subdistrictId: validate.subdistrictId,
                street: validate.street,
                postalCode: validate.postalCode,
                markAs: validate.markAs === "home" ? "HOME" : "OFFICE",
                isPrimary: validate.isPrimary,
                lat: validate.lat,
                lng: validate.lng,
                locations: {
                    subdistrict: {
                        id: subDistrict.id,
                        name: subDistrict.name,
                        code: subDistrict.code
                    },
                    district: subDistrict.district,
                    city: subDistrict.city,
                    province: subDistrict.province
                }
            }

            if (validate.benchmark !== undefined) {
                addressData.benchmark = validate.benchmark
            }

            const address = await tx.address.create({
                data: addressData
            })

            return toAddressesResponse(address)
        })
    }

    static async getAll(userId: string): Promise<Array<addressesResponse>>{
        const addresses = await prismaClient.address.findMany({
            where: {
                userId: userId
            }
        })

        return addresses.map(address => toAddressesResponse(address))
    }

    static async get(userId: string, addressId: string): Promise<addressesResponse> {

        const address = await prismaClient.address.findFirst({
            where: {
                AND: [
                    { id: addressId },
                    { userId: userId }
                ]
            }
        })
        if (!address) {
            throw new ResponseError(
                404,
                "Not created address yet"
            )
        }

        return toAddressesResponse(address)
    }

    static async update(userId: string, addressId: string, req: updateAddressRequest): Promise<addressesResponse> {

        const validate = Validation.validate(AddressesValidation.UPDATE_ADDRESS_SCHEMA, req)

        return await prismaClient.$transaction(async (tx) => {
            const address = await tx.address.findFirst({
                where: {
                    AND: [
                        { id: addressId },
                        { userId: userId }
                    ]
                }
            })
            if (!address) {
                throw new ResponseError(
                    404,
                    "Address not found"
                )
            }

            if (validate.isPrimary === true) {
                await tx.address.updateMany({
                    where: {
                        userId: userId,
                        isPrimary: true,
                        NOT: {
                            id: addressId
                        }
                    },
                    data: {
                        isPrimary: false
                    }
                })
            }

            if (validate.isPrimary === false && address.isPrimary === true) {
                const TotalPrimaryAddress = await tx.address.count({
                    where: {
                        AND: [
                            { userId: userId },
                            { isPrimary: true }
                        ]
                    }
                })

                if (TotalPrimaryAddress === 1) {
                    throw new ResponseError(
                        400,
                        "At least one primary address is required"
                    )
                }
            }

            let locationData: any
            if (validate.subdistrictId) {
                const subdistrict = await tx.masterSubdistrict.findUnique({
                    where: {
                        id: validate.subdistrictId
                    }
                })
                if (!subdistrict) {
                    throw new ResponseError(404, "Subdistrict not found")
                }

                locationData = {
                    subdistrict: {
                        id: subdistrict.id,
                        name: subdistrict.name,
                        code: subdistrict.code
                    },
                    district: subdistrict.district,
                    city: subdistrict.city,
                    province: subdistrict.province
                }
            }

            const updateData: any = {}
            if (validate.subdistrictId !== undefined) updateData.subdistrictId = validate.subdistrictId
            if (validate.street !== undefined) updateData.street = validate.street
            if (validate.postalCode !== undefined) updateData.postalCode = validate.postalCode
            if (validate.benchmark !== undefined) updateData.benchmark = validate.benchmark
            if (validate.markAs !== undefined) {
                updateData.markAs = validate.markAs === "home" ? "HOME" : "OFFICE"
            }
            if (validate.isPrimary !== undefined) updateData.isPrimary = validate.isPrimary
            if (validate.lat !== undefined) updateData.lat = validate.lat
            if (validate.lng !== undefined) updateData.lng = validate.lng
            if (locationData !== undefined) updateData.locations = locationData

            const newAddress = await tx.address.update({
                where: {
                    id: addressId
                },
                data: updateData
            })

            return toAddressesResponse(newAddress)
        })
    }

    static async delete(userId: string, addressId: string) {

        return await prismaClient.$transaction(async (tx) => {
            const address = await tx.address.findFirst({
                where: {
                    id: addressId,
                    userId: userId
                }
            })
            if (!address) {
                throw new ResponseError(
                    404, "Address not found")
            }
            if (address.isPrimary) {
                const anotherAddress = await tx.address.findFirst({
                    where: {
                        userId: userId,
                        NOT: {
                            id: addressId
                        }
                    },
                    orderBy: {
                        createdAt: 'asc'
                    }
                })
                if (anotherAddress) {
                    await tx.address.update({
                        where: {
                            id: anotherAddress.id
                        },
                        data: {
                            isPrimary: true
                        }
                    })
                }
            }
    
            await tx.address.delete({
                where: {
                    id: addressId 
                }
            })
        })
    }
}