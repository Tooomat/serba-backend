import { prismaClient } from "../application/database";
import { ResponseError } from "../error/service-response.error";
import { toUserResponse, userResponse } from "../model/users.model";

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
                status: true
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
}