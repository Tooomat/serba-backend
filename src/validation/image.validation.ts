import fs from "fs";
import path from "path";

export function imageWebpIsExist (
    imagePath: string
){
    if (!imagePath.toLowerCase().endsWith(".webp")) {
        throw new Error(
            `Invalid image format. Only .webp allowed: ${imagePath}`
        )
    }
    const absolutePath = path.join(process.cwd(), imagePath);

    if (!fs.existsSync(absolutePath)) {
        throw new Error(
        `Image file not found: ${absolutePath}`
        );
    }
}