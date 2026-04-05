import { cloudinary } from "../application/cloudinary";
import { ResponseError } from "../error/service-response.error";
import { UploadedFile } from "../model/auth.model";

type CloudinaryFolder = 
    | "serba/profile-pictures"
    // | "serba/..."

interface UploadOptions {
    folder: CloudinaryFolder
    transformation: object[] 
}

export async function uploadToCloudinary(file: UploadedFile, options: UploadOptions): Promise<string> {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream (
            {
                folder: options.folder,
                resource_type: "image",
                transformation: options.transformation
            },
            (error, result) => {
                if (error || !result) return reject(error ?? new ResponseError(400, "Upload failed"))
                    resolve(result.secure_url)
            }
        )

        stream.end(file.buffer)
    })
}

// Helper untuk ekstrak public_id dari Cloudinary URL
// https://res.cloudinary.com/demo/image/upload/v123/etalase/profile-pictures/abc.jpg
// → "etalase/profile-pictures/abc"
export function extractCloudinaryPublicId(url: string): string | null {
    try {
        const match = url.match(/\/upload\/(?:v\d+\/)?(.+)\.[a-z]+$/)
        return match?.[1] ?? null
    } catch {
        return null
    }
}