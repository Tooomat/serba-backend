import { JobCategory } from "../generated/prisma/client";

/**
 * Get primary image using cycle algorithm
 * 
 * Algorithm:
 * 1. Try to get next image from first category in cycle (image1 → image2 → image3)
 * 2. If first category exhausted (all 3 images used), move to next category
 * 3. If job has different categories than previous, start from that category's image1
 * 4. If same category appears again later, continue from where it left off
 * 
 * @param categories - Array of job categories
 * @param tracker - Map tracking current image index per category
 * @returns Image URL or default placeholder
 */
export function getCyclePrimaryImage(
    categories: JobCategory[],
    tracker: Map<string, number>
): string {

    if (categories.length === 0) {
        throw new Error("Job must have at least one category")
    }
    
    for (const category of categories) {
        const categoryId = category.id

        const images = [
            category.image1,
            category.image2,
            category.image3
        ].filter((img): img is string => !!img)

        if (images.length === 0) continue

        const currentIndex = tracker.get(categoryId) ?? 0
        const imageIndex = currentIndex % images.length
        const selectedImage = images[imageIndex]

        if (!selectedImage) continue

        tracker.set(categoryId, currentIndex + 1)

        return selectedImage
    }

    throw new Error("No valid image found")
}