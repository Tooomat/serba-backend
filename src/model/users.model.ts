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
}

export function toUserResponse(
    user: Pick<User, 'id' | 'username' | 'email' | 'profilePictUrl' | 'firstName' | 'lastName' | 'isEmailVerified' | 'isPhoneVerified' | 'status'>
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
        status: formater.userFormatter.status(user.status)
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
    birthDate: Date
    updatedAt: Date
}

export function toUpdateUserResponse(
    user: Pick<User, 'id' | 'username' | 'firstName' | 'lastName' | 'birthDate' | 'updatedAt'>
): updateUserResponse {
    return {
        id: user.id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        birthDate: user.birthDate,
        updatedAt: user.updatedAt!
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
    updatedAt?: Date | null
}
export function toUpdateProfilePictResponse(
    user: Pick<User, 'id' | 'profilePictUrl' | 'updatedAt'>
): updateProfilePictResponse {
    return {
        id: user.id,
        profilePict: user.profilePictUrl,
        updatedAt: user.updatedAt
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
    createdAt: Date
    // hanya muncul kalau own profile
    email?: string | undefined
    phone?: string | undefined
    birthDate?: Date | undefined
    status?: string | undefined
    isEmailVerified?: boolean | undefined
    isPhoneVerified?: boolean | undefined
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
        'isPhoneVerified' | 'createdAt'
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
        asWorker: workerStats,
        asProvider: providerStats,
    }

    if (isOwnProfile) {
        response.email = user.email
        response.phone = user.phone
        response.birthDate = user.birthDate
        response.status = user.status
        response.isEmailVerified = user.isEmailVerified
        response.isPhoneVerified = user.isPhoneVerified

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