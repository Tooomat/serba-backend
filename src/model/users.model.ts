import { User } from "../generated/prisma/client";
import { formater } from "../utils/formater.utils";

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