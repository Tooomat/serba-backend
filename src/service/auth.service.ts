import { prismaClient } from "../application/database";
import { ResponseError } from "../error/service-response.error";
import { registerRequest, registerResponse, toRegisterResponse } from "../model/user.model";
import { AuthValidation } from "../validation/auth.validation";
import { Validation } from "../validation/validation";
import bcrypt from "bcrypt";

export class AuthService {
    static async register(req: registerRequest): Promise<registerResponse> {
        const validation = Validation.validate(AuthValidation.REGISTERSCHEMA, req)

        const totalUserWithSameUsername = await prismaClient.user.count({
            where: {
                username: validation.username 
            }
        })
        const totalUserWithSameEmail = await prismaClient.user.count({
            where: {
                email: validation.email 
            }
        })
        if (totalUserWithSameUsername != 0) {
            throw new ResponseError(400, "username already exists")
        }
        if (totalUserWithSameEmail != 0) {
            throw new ResponseError(400, "email already exists")
        }

        validation.password = await bcrypt.hash(validation.password, 10)

        const user = await prismaClient.user.create({
            data: {
                username: validation.username,
                email: validation.email,
                password: validation.password,
                firstName: validation.firstName,
                birthDate: validation.birthDate,
                phone: validation.phone,
                lastName: validation.lastName ?? null,
                profilePictUrl: validation.profilePictUrl ?? null,
            }
        })

        return toRegisterResponse(user)
    }
}