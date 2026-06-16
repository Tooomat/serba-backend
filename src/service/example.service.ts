// import { prismaClient } from "../application/database";
// import { ExampleRequest, ExampleResponse, toExampleResponse } from "../model/example.model";
// import { ResponseError } from "../error/service-response.error";
// import { ExampleValidation } from "../validation/example.validation";
// import { Validation } from "../validation/validation";
// import bcrypt from "bcrypt";


// export class ExampleService {

//     static async service(req: ExampleRequest): Promise<ExampleResponse> {
//         const validationReq = Validation.validate(ExampleValidation.EXAMPLESCHEMA, req)

//         // check user
//         const totalUserWithSameUsername = await prismaClient.user.count({
//             where: {
//                 username: validationReq.username
//             }
//         })
//         if (totalUserWithSameUsername != 0) {
//             throw new ResponseError(400, "username already exists")
//         }

//         // hashing pass
//         validationReq.password = await bcrypt.hash(validationReq.password, 10)

//         // create user
//         const user = await prismaClient.user.create({
//             data: validationReq
//         })

//         return toExampleResponse(user)
//     }
// }