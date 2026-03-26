export function parseTimeToDate(time: string): Date {
    const parts = time.split(":")

    if (parts.length < 2) {
        throw new Error("Invalid time format. Expected HH:mm")
    }

    const hour = Number(parts[0])
    const minute = Number(parts[1])

    if (
        isNaN(hour) || isNaN(minute) ||
        hour < 0 || hour > 23 ||
        minute < 0 || minute > 59
    ) {
        throw new Error("Invalid time value")
    }

    const now = new Date()
    now.setHours(hour, minute, 0, 0)

    return now
}

export function parseDateToDay(date: Date | null): string | null{
    if (date === null) {
        return null
    }

    const days = [
        'Sunday',
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday'
    ]

    const dayName = days[date.getDay()]
    const dateStr = date.toLocaleDateString('en-US', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    })
    
    return `${dayName}, ${dateStr}`
    // Example: "Selasa, 25 Desember 2024"
}

export function countStartDateToEndDate(startDate: Date, endDate: Date): string | null {
    if (startDate > endDate) {
        return null
    }

    let years = endDate.getFullYear() - startDate.getFullYear()
    let months = endDate.getMonth() - startDate.getMonth() 
    let days = endDate.getDate() - startDate.getDate()

    if (days < 0) {
        months -= 1
        const previousMonth = new Date(endDate.getFullYear(), endDate.getMonth(), 0)
        days += previousMonth.getDate()
    }
    
    if (months < 0) {
        years -= 1;
        months += 12;
    }

    const parts: string[] = [];

    if (years > 0) parts.push(`${years} year${years > 1 ? "s" : ""}`);
    if (months > 0) parts.push(`${months} month${months > 1 ? "s" : ""}`);
    if (days > 0) parts.push(`${days} day${days > 1 ? "s" : ""}`);

    return parts.length > 0 ? parts.join(" ") : "1 day";

}

type Locale = 'en' | 'id'
export function getTimeAgo(date: Date, locale: Locale = 'en'): string {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffSeconds = Math.floor(diffMs / 1000)
    const diffMinutes = Math.floor(diffSeconds / 60)
    const diffHours = Math.floor(diffMinutes / 60)
    const diffDays = Math.floor(diffHours / 24)
    const diffWeeks = Math.floor(diffDays / 7)
    const diffMonths = Math.floor(diffDays / 30)
    const diffYears = Math.floor(diffDays / 365)

    if (diffMs < 0) return locale === 'id' ? "Di masa depan" : "In the future"
    
    const translations = {
        en: {
            justNow: "Just now",
            minute: (n: number) => n === 1 ? "1 minute ago" : `${n} minutes ago`,
            hour: (n: number) => n === 1 ? "1 hour ago" : `${n} hours ago`,
            day: (n: number) => n === 1 ? "1 day ago" : `${n} days ago`,
            week: (n: number) => n === 1 ? "1 week ago" : `${n} weeks ago`,
            month: (n: number) => n === 1 ? "1 month ago" : `${n} months ago`,
            year: (n: number) => n === 1 ? "1 year ago" : `${n} years ago`
        },
        id: {
            justNow: "Baru saja",
            minute: (n: number) => n === 1 ? "1 menit yang lalu" : `${n} menit yang lalu`,
            hour: (n: number) => n === 1 ? "1 jam yang lalu" : `${n} jam yang lalu`,
            day: (n: number) => n === 1 ? "1 hari yang lalu" : `${n} hari yang lalu`,
            week: (n: number) => n === 1 ? "1 minggu yang lalu" : `${n} minggu yang lalu`,
            month: (n: number) => n === 1 ? "1 bulan yang lalu" : `${n} bulan yang lalu`,
            year: (n: number) => n === 1 ? "1 tahun yang lalu" : `${n} tahun yang lalu`
        }
    }

    const t = translations[locale]

    if (diffSeconds < 60) return t.justNow
    if (diffMinutes < 60) return t.minute(diffMinutes)
    if (diffHours < 24) return t.hour(diffHours)
    if (diffDays < 7) return t.day(diffDays)
    if (diffWeeks < 4) return t.week(diffWeeks)
    if (diffMonths < 12) return t.month(diffMonths)
    return t.year(diffYears)
}