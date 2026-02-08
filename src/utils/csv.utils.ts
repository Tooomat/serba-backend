import fs from "fs"
import csv from "csv-parser"

export function loadCsv<T>(path: string): Promise<T[]> {
    return new Promise((resolve, reject) => {
        const rows: T[] = []
        
        fs.createReadStream(path)
            .pipe(csv({ headers: ["code", "name"] }))
            .on('data', (row) => {
                rows.push(row)
            })
            .on('end', () => {
                console.log('CSV file successfully processed');
                resolve(rows)
            })
            .on("error", reject)
    })
}

export function toTitleCase(value: string): string{
    const result: string = value
        .toLowerCase()
        .split(" ")
        .map(word => 
            word? word[0]!.toUpperCase() + word.slice(1) : ""
        )
        .join(" ")
    return result
}

export function getParentCode(code: string) {
  const parts = code.split(".")
  parts.pop()
  return parts.join(".")
}
