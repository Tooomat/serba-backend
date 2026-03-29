import { JsonValue } from "@prisma/client/runtime/client"

export function parseJsonLocation<T>(value: JsonValue): T {
    return value as T
}

export function haversineDistance(
    latSource: number,
    lngSource: number,
    latDes: number,
    lngDes: number
): number {
    const R = 6371 // Radius bumi dalam km

    const dLat = (latDes - latSource) * Math.PI / 180
    const dLng = (lngDes - lngSource) * Math.PI / 180

    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(latSource * Math.PI / 180) * Math.cos(latDes * Math.PI / 180) * 
        Math.sin(dLng/2) * Math.sin(dLng/2)

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c // Jarak dalam km
}

export function formatDistance(
    userLat: number,
    userLng: number,
    jobLat: number,
    jobLng: number
): string {
    const km = haversineDistance(userLat, userLng, jobLat, jobLng)
    return km < 1
        ? `${Math.round(km * 1000)} m`
        : `${km.toFixed(1)} km`
}