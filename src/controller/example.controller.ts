import { NextFunction, Request, Response } from "express";
import { ExampleRequest, ExampleResponse } from "../model/example.model";
import { ExampleService } from "../service/example.service";
import { success } from "zod";
import { success_handler, WebResponse } from "../web/http/web-response.http";

export class ExampleController {

    static async controller(req: Request, res: Response, next: NextFunction) {
        try {
            const request: ExampleRequest = req.body

            const result = await ExampleService.service(request)

            success_handler(res, "success", result, 200)
        } catch (e) {
            next(e) // throw to middleware
        }
    }
}