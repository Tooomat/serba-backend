import { prismaClient } from "../application/database";
import { ResponseError } from "../error/service-response.error";
import { toUserResponse, userResponse } from "../model/users.model";

export class UsersService {
    static async current(userId: string): Promise<userResponse> {
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

        return toUserResponse(user)
    }
}