import { User } from "../generated/prisma/client"

export type ExampleRequest = {
    username: string
    name: string
    password: string
}

export type ExampleResponse = {
    username: string
    name: string
    token?: string
}

export function toExampleResponse(user: User): ExampleResponse {
    return {
        username: user.username,
        name: user.name,
    }
}