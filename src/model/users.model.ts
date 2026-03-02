import { email } from "zod";
import { User } from "../generated/prisma/client";
import { parseDateToDay } from "../utils/time.utils";

export type userResponse = {
    id: string,
    username: string,
    email: string,
    profilePictUrl?: string | null,
    name: string,
    isEmailVerified: boolean,
    isPhoneVerified: boolean,
}

export function toUserResponse(user: User): userResponse {
    const name = user.firstName.concat(" ", user.lastName ? user.lastName : "")
    return {
        id: user.id,
        username: user.username,
        email: user.email,
        profilePictUrl: user.profilePictUrl,
        name: name,
        isEmailVerified: user.isEmailVerified,
        isPhoneVerified: user.isPhoneVerified,
    }
}