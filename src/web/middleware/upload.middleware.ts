import multer, { FileFilterCallback } from "multer";
import { Request } from "express";
import { ResponseError } from "../../error/service-response.error";

const imageFileFilter = (_req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
    const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (allowed.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new ResponseError(400, "Only JPEG, JPG, PNG, and WEBP images are allowed"));
    }
}
const storage = multer.memoryStorage()

// Profile picture — max 2MB
export const uploadProfilePict = multer({
    storage: storage,
    fileFilter: imageFileFilter,
    limits: { fileSize: 2 * 1024 * 1024 },
})