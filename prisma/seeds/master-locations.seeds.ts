import { prismaClient } from "../../src/application/database";
import { csvHelper } from "../../src/utils/csv.utils"

type CsvRows = {
    code: string
    name: string
}

export class MasterLocations {
    static async masterProvince(filePath: string) {
        const rows = await csvHelper.loadCsv<CsvRows>(filePath)
        let counter = 1

        const provinceMaps = new Map<string, CsvRows>()

        rows.forEach(row => {
            if (!row.code.includes(".")) {
                provinceMaps.set(row.code, {
                    code: row.code,
                    name: csvHelper.toTitleCase(row.name.trim())
                })
            }
        })

        const provinces = Array.from(provinceMaps.values())

        if (provinces.length === 0) {
            console.warn("No province found")
            return
        }

        for (const { code, name } of provinces) {
            await prismaClient.masterProvince.upsert({
                where: { 
                    code: code
                },
                update: { 
                    name: name 
                },
                create: {
                    id: `P${code}`,
                    code: code,
                    name: name
                }
            })
        }
        console.log(`Seeded ${provinces.length} provinces`)
    }

    static async masterCities(filePath: string) {
        const rows = await csvHelper.loadCsv<CsvRows>(filePath)

        let counter = 1
        const citiesMap = new Map<string, CsvRows>()
        rows.forEach(row => {
            if (row.code.split(".").length === 2) {
                citiesMap.set(row.code, {
                    code: row.code,
                    name: csvHelper.toTitleCase(row.name.trim())
                })
            }
        })

        const cities = Array.from(citiesMap.values())

        if (cities.length === 0) {
            console.warn("No city found")
            return
        }

        for(const city of cities) {
            const province = await prismaClient.masterProvince.findUnique({
                where: {
                    code: csvHelper.getParentCode(city.code)
                }
            })

            if(!province) {
                console.warn(`Province not found for city ${city.code}`)
                continue
            }

            await prismaClient.masterCity.upsert({
                where: {
                    code: city.code
                },
                update: {
                    name: city.name,
                    provinceId: province.id,
                    province: {
                        id: province.id,
                        code: province.code,
                        name: province.name
                    }
                },
                create: {
                    id: `C${city.code.replaceAll(".", "")}`,
                    code: city.code,
                    name: city.name,
                    provinceId: province.id,
                    province: {
                        id: province.id,
                        code: province.code,
                        name: province.name
                    }
                }
            })
        }

        console.log(`Seeded ${cities.length} cities`)
    }

    static async masterDistricts(filePath: string) {
        const rows = await csvHelper.loadCsv<CsvRows>(filePath)
        
        let counter = 1
        const districtMap = new Map<string, CsvRows>()

        rows.forEach(row => {
            if (row.code.split(".").length === 3) {
                districtMap.set(row.code, {
                    code: row.code,
                    name: csvHelper.toTitleCase(row.name.trim())
                })
            }
        })

        const districts = Array.from(districtMap.values())
        if (districts.length === 0) {
            console.warn("No districts found")
            return
        }

        for(const district of districts) {
            const city = await prismaClient.masterCity.findUnique({
                where: {
                    code: csvHelper.getParentCode(district.code)
                }
            })

            if (!city) {
                console.warn(`City not found for districts ${district.code}`)
                continue
            }

            await prismaClient.masterDistrict.upsert({
                where: {
                    code: district.code
                },
                update: {
                    name: district.name,
                    cityId: city.id,
                    province: city.province!,
                    city: {
                        id: city.id,
                        code: city.code,
                        name: city.name
                    }
                },
                create: {
                    id: `D${district.code.replaceAll(".", "")}`,
                    code: district.code,
                    name: district.name,
                    cityId: city.id,
                    province: city.province!,
                    city: {
                        id: city.id,
                        code: city.code,
                        name: city.name
                    }
                }
            })
        }
        console.log(`Seeded ${districts.length} districts`)
    }

    static async masterSubDistricts(filePath: string) {
        const rows = await csvHelper.loadCsv<CsvRows>(filePath)
        
        let counter = 1
        const subDistrictMap = new Map<string, CsvRows>()

        rows.forEach(row => {
            if (row.code.split(".").length === 4) {
                subDistrictMap.set(row.code, {
                    code: row.code,
                    name: csvHelper.toTitleCase(row.name.trim())
                })
            }
        })

        const subDistricts = Array.from(subDistrictMap.values())
        if (subDistricts.length === 0) {
            console.warn("No sub-districts found")
            return
        }

        for (const subDistrict of subDistricts) {
            const district = await prismaClient.masterDistrict.findUnique({
                where: {
                    code: csvHelper.getParentCode(subDistrict.code)
                }
            })

            if(!district) {
                console.warn(`District not found for Sub district ${subDistrict.code}`)
                continue
            }


            await prismaClient.masterSubdistrict.upsert({
                where: {
                    code: subDistrict.code
                },
                update: {
                    name: subDistrict.name,
                    districtId: district.id,
                    province: district.province!,
                    city: district.city!,
                    district: {
                        id: district.id,
                        code: district.code,
                        name: district.name
                    }
                },
                create: {
                    id: `S${subDistrict.code.replaceAll(".", "")}`,
                    code: subDistrict.code,
                    name: subDistrict.name,
                    districtId: district.id,
                    province: district.province!,
                    city: district.city!,
                    district: {
                        id: district.id,
                        code: district.code,
                        name: district.name
                    }
                }
            })
        }
        console.log(`Seeded ${subDistricts.length} sub districts`)
    }
}