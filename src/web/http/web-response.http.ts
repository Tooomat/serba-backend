import { Response } from "express"

export interface WebResponse<T> {
    success: boolean
    message?: string
    data?: T
    error?: T
}

// SUCCESS
export function success_handler<T> ( 
    res: Response,
    message = "",
    data: T,
    status: number,
): Response<WebResponse<T>>{
    const response: WebResponse<T> = {
        success: true,
        message,
        data
    }

    return res.status(status).json(response)
}

export function success_handler_without_data<T> ( 
    res: Response,
    message = "",
    status: number,
): Response<WebResponse<T>>{
    const response: WebResponse<T> = {
        success: true,
        message
    }

    return res.status(status).json(response)
}

export function not_found_handler<T> ( 
    res: Response,
    message = "not found",
    status = 401,
): Response<WebResponse<T>>{
    const response: WebResponse<T> = {
        success: true,
        message,
    }

    return res.status(status).json(response)
}