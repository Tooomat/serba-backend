import { cloudinary } from "../application/cloudinary";
import { prismaClient } from "../application/database";
import { ResponseError } from "../error/service-response.error";
import { Prisma } from "../generated/prisma/client";
import { extractCloudinaryPublicId, uploadToCloudinary } from "../helper/cloudinary.helper";
import { 
    deleteProfilePictResponse,
    getProfileResponse, 
    toDeleteProfilePictResponse, 
    toGetProfileResponse, 
    toUpdateProfilePictResponse, 
    toUpdateUserResponse, 
    toUserResponse, 
    updateProfilePictResponse, 
    updateUserRequest, 
    updateUserResponse, 
    UploadUpdateProfilePict, 
    userResponse
} from "../model/users.model";
import { UsersValidation } from "../validation/users.validation";
import { Validation } from "../validation/validation";
import { getProviderStats, getWorkerStats } from "./helper/users.helper";

export class UsersService {
    static async current(userId: string): Promise<userResponse> {
        const user = await prismaClient.user.findUnique({
            where: {
                id: userId
            },
            select: {
                id: true,
                username: true,
                email: true,
                profilePictUrl: true,
                lastName: true,
                firstName: true,
                isEmailVerified: true,
                isPhoneVerified: true,
                status: true,
                isProfileComplete: true,
            }
        })
        if (!user) {
            throw new ResponseError(
                404,
                "User not found"
            )
        }

        return toUserResponse(user)
    }

    static async update(userId: string, req: updateUserRequest): Promise<updateUserResponse> {
        const validation = Validation.validate(UsersValidation.UPDATE_SCHEMA, req)

        const user = await prismaClient.user.findUnique({
            where: {
                id: userId
            }
        })
        if (!user) {
            throw new ResponseError(
                404,
                "User not found"
            )
        }

        // Cek apakah ada field yang dikirim — jangan update kalau kosong semua
        const hasUpdate = Object.values(validation).some(v => v !== undefined)
        if (!hasUpdate) throw new ResponseError(400, "No fields to update")

        const updateData: Prisma.UserUpdateInput = {}
        if (validation.username !== undefined) {
            const countUsernameTaken = await prismaClient.user.count({
                where: {
                    username: validation.username,
                    NOT: { id: userId }
                }
            })

            if (countUsernameTaken !== 0) {
                throw new ResponseError(
                    400,
                    "Username already taken"
                )
            }

            updateData.username = validation.username
        }
        if (validation.firstName !== undefined) updateData.firstName = validation.firstName
        if (validation.lastName !== undefined) updateData.lastName = validation.lastName
        if (validation.birthDate !== undefined) updateData.birthDate = validation.birthDate

        const mergedBirthDate = validation.birthDate ?? user.birthDate
        // isProfileComplete = phone sudah verified DAN birthDate sudah ada
        const isProfileComplete = !!(user.phone && user.isPhoneVerified && user.phoneVerifiedAt && mergedBirthDate)
        updateData.isProfileComplete = isProfileComplete

        const updatedUser = await prismaClient.user.update({
            where: { id: userId },
            data: updateData,
            select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true,
                birthDate: true,
                updatedAt: true,
                isProfileComplete: true
            }
        })

        return toUpdateUserResponse(updatedUser)
    }

    static async updateProfilePict(userId: string, file?: UploadUpdateProfilePict): Promise<updateProfilePictResponse> {
        if (!file) throw new ResponseError(400, "Profile picture is required")
            
        const user = await prismaClient.user.findUnique({
            where: { 
                id: userId 
            }
        })
        if (!user) {
            throw new ResponseError(
                404,
                "user not found"
            )
        }

        return await prismaClient.$transaction(async (tx) => {
            
            let newProfilePictUrl: string = await uploadToCloudinary(file, {
                folder: "serba/profile-pictures",
                transformation: [
                    { width: 400, height: 400, crop: "fill", gravity: "face" }
                ]
            })

            const newPicture = await tx.user.update({
                where: {
                    id: user.id
                },
                data: {
                    profilePictUrl: newProfilePictUrl
                },
                select: {
                    id: true,
                    profilePictUrl: true,
                    updatedAt: true
                }
            })

            let deleteOldFailed = false
            if (user.profilePictUrl) {
                const publicId = extractCloudinaryPublicId(user.profilePictUrl)
                if (publicId) {
                    try {
                        await cloudinary.uploader.destroy(publicId)
                    } catch (e) {
                        deleteOldFailed = true
                        // logger.error("Failed to delete old profile picture", { publicId, error: e.message })
                    }
                }
            }
            
            return toUpdateProfilePictResponse(
                newPicture,
                deleteOldFailed === true ? "Profile picture updated, but old picture could not be removed" : undefined
            )
        }) 
    }

    static async profile(userId: string, isOwnProfile: boolean): Promise<getProfileResponse> {
        const user = await prismaClient.user.findUnique({
            where: {
                id: userId
            },
            select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true,
                profilePictUrl: true,
                email: true,
                phone: true,
                birthDate: true,
                status: true,
                isEmailVerified: true,
                isPhoneVerified: true,
                isProfileComplete: true,
                createdAt: true
            }
        })
        if (!user) {
            throw new ResponseError(
                404,
                "User not found"
            )
        }

        const [address, workerStats, providerStats, totalBookmark] = await Promise.all([
            prismaClient.address.findFirst({
                where: { 
                    userId: userId, 
                    isPrimary: true 
                },
                select: { 
                    locations: true 
                }
            }),

            getWorkerStats(userId),

            getProviderStats(userId),

            isOwnProfile
                ? prismaClient.bookmarks.count({ where: { userId } })
                : Promise.resolve(0)
        ])
        
        return toGetProfileResponse(
            user, 
            address, 
            workerStats, 
            providerStats, 
            isOwnProfile,
            totalBookmark
        )
    }

    static async deleteProfilePict(userId: string): Promise<deleteProfilePictResponse> {
        const user = await prismaClient.user.findUnique({
            where: { id: userId }
        })
        if (!user) {
            throw new ResponseError(404, "User not found")
        }

        if (!user.profilePictUrl) {
            throw new ResponseError(400, "Profile picture not found")
        }
        
        const updated = await prismaClient.user.update({
            where: { 
                id: userId 
            },
            data: { 
                profilePictUrl: null 
            },
            select: {
                id: true,
                updatedAt: true
            }
        })
        
        let deleteCloudinaryFailed = false
        const publicId = extractCloudinaryPublicId(user.profilePictUrl)
        if (publicId) {
            try {
                await cloudinary.uploader.destroy(publicId)
            } catch (e) {
                deleteCloudinaryFailed = true
            }
        }

        return toDeleteProfilePictResponse(
            updated,
            deleteCloudinaryFailed === true ? "Profile picture deleted from profile, but failed to remove from storage" : undefined
        )
    }
}