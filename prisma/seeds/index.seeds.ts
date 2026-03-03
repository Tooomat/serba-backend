import { prismaClient } from "../../src/application/database"
import { BASE_IMAGE_PATH, seedJobCategories } from "./job-categories.seeds"
import { MasterLocations } from "./master-locations.seeds"
import path from "path"

const PATH_FILE_WILAYAH = path.resolve(
  process.cwd(),
  "public/assets/file/base-kode-wilayah.csv"
)

async function seed(){
  // Seed Function Call Goes Here
  console.log("🌱 Starting seeding...")
  console.log("📂 Current Directory:", process.cwd())
  console.log("📂 __dirname:", __dirname)

  console.log("PATH KODE WILAYAH")
  console.log("📂 CSV Path:", PATH_FILE_WILAYAH)

  console.log("PATH IMAGE")
  console.log("📂 images Path:", BASE_IMAGE_PATH)

  await seedJobCategories()
  await MasterLocations.masterProvince(PATH_FILE_WILAYAH)
  await MasterLocations.masterCities(PATH_FILE_WILAYAH)
  await MasterLocations.masterDistricts(PATH_FILE_WILAYAH)
  await MasterLocations.masterSubDistricts(PATH_FILE_WILAYAH)

  console.log("ALL SEEDING DONE")
}

seed()
.catch((e) => {
  console.error(e)
  process.exit(1)
})
.finally(async () => {
  await prismaClient.$disconnect()
})