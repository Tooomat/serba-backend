export type GeocodingSearchRequest = {
    province?: string | undefined
    city?: string | undefined
    district?: string | undefined
    subDistrict?: string | undefined
    postalCode?: string | undefined
    street?: string | undefined
}
export type GeocodingSearchResponse = {
    lat: string
    lng: string
    displayName: string
}
export function toGeocodingResult(item: any): GeocodingSearchResponse {
    return {
        lat: item.lat,
        lng: item.lon,
        displayName: item.display_name
    }
}