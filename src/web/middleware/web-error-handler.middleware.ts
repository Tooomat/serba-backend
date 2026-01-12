import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { ResponseError } from "../../error/service-response.error";

const getStatusMessage = (status: number): string => {
    const statusMessages: Record<number, string> = {
        400: "Bad request",
        401: "Unauthorized",
        403: "Forbidden",
        404: "Not found",
        409: "Conflict",
        422: "Unprocessable entity",
        500: "Internal server error",
        502: "Bad gateway",
        503: "Service unavailable"
    }

    return statusMessages[status] || "An error occurred"
}

export const ErrorHandlerMiddleware = async (
    err: Error,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    if (err instanceof ZodError) {
        res.status(400).json({
            success: false,
            message: "Validation error",
            errors: err.issues.map(e => ({
                path: e.path.join('.'),
                message: e.message
            }))
        })
    } else if (err instanceof ResponseError) {
        res.status(err.status).json({
            success: false,
            message: getStatusMessage(err.status),
            errors: err.message
        })
    } else {
        res.status(500).json({
            success: false,
            message: "Internal server error",
            errors: err.message
        })
    }
}