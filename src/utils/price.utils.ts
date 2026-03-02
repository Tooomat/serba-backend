export function priceUrgentJobProvider(type: string, price: number): number {
    if (type === "URGENT") {
        const adminFees = 2500
        const urgentFees = price * 0.15
        return price + adminFees + urgentFees 
    } else {
        return price
    }
}