import { NextFunction, Response } from "express";
import { AuthRequest } from "../web/middleware/auth.middleware";
import { createAddressesRequest, updateAddressRequest } from "../model/addresses.model";
import { AddressesService } from "../service/addresses.service";
import { success_handler, success_handler_without_data } from "../web/http/web-response.http";

export class AddressesController {
    static async create(auth: AuthRequest, res: Response, next: NextFunction) {
        try {
            const request: createAddressesRequest = auth.body as createAddressesRequest

            const result = await AddressesService.create(auth.user!.id, request)
            success_handler(res, "create addresses successful", result, 201)
        } catch (e) {
            next(e)
        }
    }

    static async get(auth: AuthRequest, res: Response, next: NextFunction) {
        try {
            const addressId: string = String(auth.params.addressId)
            const result = await AddressesService.get(auth.user!.id, addressId)
            success_handler(res, "get address successful", result, 200)
        } catch (e) {
            next(e)
        }
    }

    static async getAll(auth: AuthRequest, res: Response, next: NextFunction) {
        try {
            const results = await AddressesService.getAll(auth.user!.id)
            success_handler(res, "get addresses successful", results, 200)
        } catch (e) {
            next(e)
        }
    }

    static async update(auth: AuthRequest, res: Response, next: NextFunction) {
        try {
            const addressId: string = String(auth.params.addressId)
            const request: updateAddressRequest = auth.body as updateAddressRequest

            const result = await AddressesService.update(auth.user!.id, addressId, request)
            success_handler(res, "update address successful", result, 200)
        } catch (e) {
            next(e)
        }
    }

    static async delete(auth: AuthRequest, res: Response, next: NextFunction) {
        try {
            const addressId: string = String(auth.params.addressId)
            await AddressesService.delete(auth.user!.id, addressId)

            success_handler_without_data(res, "delete address successful", 200)
        } catch (e) {
            next(e)
        }
    }
}