import { Address, TypeReview, User } from "../generated/prisma/client";
import { formater } from "../utils/formater.utils";
import { locationUtils } from "../utils/location.utils";

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

// ================================== GET ==================================
export type userResponse = {
    id: string,
    username: string,
    email: string,
    profilePictUrl?: string | null,
    name: string,
    isEmailVerified: boolean,
    isPhoneVerified: boolean,
    status: string
    isProfileComplete: boolean
}

export function toUserResponse(
    user: Pick<User, 'id' | 'username' | 'email' | 'profilePictUrl' | 'firstName' | 'lastName' | 'isEmailVerified' | 'isPhoneVerified' | 'status' |'isProfileComplete'>
): userResponse {
    const name = user.firstName.concat(" ", user.lastName ? user.lastName : "")
    return {
        id: user.id,
        username: user.username,
        email: user.email,
        profilePictUrl: user.profilePictUrl,
        name: name,
        isEmailVerified: user.isEmailVerified,
        isPhoneVerified: user.isPhoneVerified,
        status: formater.userFormatter.status(user.status),
        isProfileComplete: user.isProfileComplete
    }
}

// ================================== UPDATE USER ==================================
export type updateUserRequest = {
    username?: string | undefined
    firstName?: string | undefined
    lastName?: string | undefined
    birthDate?: string | undefined
}

export type updateUserResponse = {
    id: string
    username: string
    firstName: string
    lastName?: string | null
    birthDate?: Date | null
    updatedAt: Date | null,
    isProfileComplete: boolean
}

export function toUpdateUserResponse(
    user: Pick<User, 'id' | 'username' | 'firstName' | 'lastName' | 'birthDate' | 'updatedAt' | 'isProfileComplete'>
): updateUserResponse {
    return {
        id: user.id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        birthDate: user.birthDate,
        updatedAt: user.updatedAt,
        isProfileComplete: user.isProfileComplete
    }
}

// ================================== UPDATE USER PROFILE PICTURE ==================================
export type UploadUpdateProfilePict = {
  //fieldname: string
  originalname: string
  //encoding: string
  mimetype: string
  buffer: Buffer
  //size: number
}
export type updateProfilePictResponse = {
    id: string
    profilePict?: string | null
    updatedAt?: Date | null,
    warning?: string | undefined
}
export function toUpdateProfilePictResponse(
    user: Pick<User, 'id' | 'profilePictUrl' | 'updatedAt'>,
    warning?: string | undefined
): updateProfilePictResponse {
    return {
        id: user.id,
        profilePict: user.profilePictUrl,
        updatedAt: user.updatedAt,
        warning: warning
    }
}

// ================================== OWN PROFILE ==================================
export type reviewDistribution = {
    5: number
    4: number
    3: number
    2: number
    1: number
    0: number
}

type latestReview = {
    id: string
    rating: number
    type: TypeReview
    review: {
        comment?: string | null
        by: {
            id: string
            name: string
            profilePictUrl?: string | null
        }
        createdAt: Date
        updatedAt?: Date | null
    }
    job: {
        id: string
        title: string
    }
}

export type workerStats = {
    totalApplied: number
    totalAccepted: number
    totalRejected: number
    reviews: {
        averageRating: number
        totalReviews: number
        distribution: reviewDistribution
        latest: latestReview[]
    }
}

export type providerStats = {
    totalJobsPosted: number
    totalJobsCompleted: number
    totalJobsCanceled: number
    reviews: {
        averageRating: number
        totalReviews: number
        distribution: reviewDistribution
        latest: latestReview[]
    }
}

export type getProfileResponse = {
    id: string
    username: string
    name: string
    profilePictUrl?: string | null
    isOwnProfile: boolean
    createdAt: Date
    // hanya muncul kalau own profile
    email?: string | undefined
    phone?: string | undefined | null
    birthDate?: Date | undefined | null
    status?: string | undefined
    isEmailVerified?: boolean | undefined
    isPhoneVerified?: boolean | undefined
    isProfileComplete?: boolean | undefined
    locations?: locationJson | undefined
    // statistik
    asWorker: workerStats
    asProvider: providerStats
    bookmark?: {
        totalBookmark: number
    } | undefined
}
export function toGetProfileResponse(
    user: Pick<User, 
        'id' | 'username' | 'firstName' | 'lastName' | 'email' | 'phone' | 
        'profilePictUrl' | 'birthDate' | 'status' | 'isEmailVerified' | 
        'isPhoneVerified' | 'createdAt' | 'isProfileComplete'
    >,
    address: Pick<Address, 'locations'> | null,
    workerStats: workerStats,
    providerStats: providerStats,
    isOwnProfile: boolean,
    totalBookmark?: number | undefined
): getProfileResponse {

    const response: getProfileResponse = {
        id: user.id,
        username: user.username,
        name: formater.getFullName(user.firstName, user.lastName),
        profilePictUrl: user.profilePictUrl,
        createdAt: user.createdAt,
        isOwnProfile: isOwnProfile,
        asWorker: workerStats,
        asProvider: providerStats,
    }

    if (isOwnProfile) {
        response.email = user.email
        response.phone = user.phone ? user.phone : null
        response.birthDate = user.birthDate ? user.birthDate : null
        response.status = user.status
        response.isEmailVerified = user.isEmailVerified
        response.isPhoneVerified = user.isPhoneVerified
        response.isProfileComplete = user.isProfileComplete
        if (address) {
            response.locations = locationUtils.parseJsonLocation<locationJson>(address.locations)
        }
        
        if (totalBookmark !== undefined) {
            response.bookmark = {
                totalBookmark: totalBookmark
            }
        }
    }

    return response
}

// ================================== DELETE PICTURE PROFILE ==================================
export type deleteProfilePictResponse = {
    id: string
    updatedAt?: Date | null
    warning?: string | undefined
}
export function toDeleteProfilePictResponse(
    user: Pick<User, 'id' | 'updatedAt'>,
    warning?: string | undefined
): deleteProfilePictResponse {
    return {
        id: user.id,
        updatedAt: user.updatedAt,
        warning: warning
    }
}