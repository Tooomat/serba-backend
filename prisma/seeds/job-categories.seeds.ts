import { prismaClient } from "../../src/application/database"
import * as imgVal from "../../src/validation/image.validation"

const BASE_IMAGE_PATH = "/public/assets/images/job-categories"
const img = (category: string, name: string, index: number) =>
  `${BASE_IMAGE_PATH}/${category}/${name}-${index}.webp`

const jobCategoriesSeed = [
  {
    code: "HOME_REPAIR",
    name: "Perbaikan Rumah",
    image1: img("HOME_REPAIR", "home-repair", 1),
    image2: img("HOME_REPAIR", "home-repair", 2),
    image3: img("HOME_REPAIR", "home-repair", 3),
  },
  {
    code: "CLEANING",
    name: "Kebersihan & Sanitasi",
    image1: img("CLEANING", "cleaning", 1),
    image2: img("CLEANING", "cleaning", 2),
    image3: img("CLEANING", "cleaning", 3),
  },
  {
    code: "ELECTRONICS",
    name: "Elektronik",
    image1: img("ELECTRONICS", "electronics", 1),
    image2: img("ELECTRONICS", "electronics", 2),
    image3: img("ELECTRONICS", "electronics", 3),
  },
  {
    code: "AUTOMOTIVE",
    name: "Kendaraan & Otomotif",
    image1: img("AUTOMOTIVE", "automotive", 1),
    image2: img("AUTOMOTIVE", "automotive", 2),
    image3: img("AUTOMOTIVE", "automotive", 3),
  },
  {
    code: "PERSONAL_CARE",
    name: "Perawatan Diri",
    image1: img("PERSONAL_CARE", "personal-care", 1),
    image2: img("PERSONAL_CARE", "personal-care", 2),
    image3: img("PERSONAL_CARE", "personal-care", 3),
  },
  {
    code: "EVENT_SERVICES",
    name: "Acara & Event",
    image1: img("EVENT_SERVICES", "event", 1),
    image2: img("EVENT_SERVICES", "event", 2),
    image3: img("EVENT_SERVICES", "event", 3),
  },
  {
    code: "EDUCATION",
    name: "Pendidikan & Les",
    image1: img("EDUCATION", "education", 1),
    image2: img("EDUCATION", "education", 2),
    image3: img("EDUCATION", "education", 3),
  },
  {
    code: "CREATIVE",
    name: "Kreatif & Desain",
    image1: img("CREATIVE", "creative", 1),
    image2: img("CREATIVE", "creative", 2),
    image3: img("CREATIVE", "creative", 3),
  },
  {
    code: "FnB",
    name: "Makanan & Minuman",
    image1: img("FNB", "FnB", 1),
    image2: img("FNB", "FnB", 2),
    image3: img("FNB", "FnB", 3),
  },
  {
    code: "HEALTH_WELLNESS",
    name: "Kesehatan & Kebugaran",
    image1: img("HEALTH_WELLNESS", "health", 1),
    image2: img("HEALTH_WELLNESS", "health", 2),
    image3: img("HEALTH_WELLNESS", "health", 3),
  },
  {
    code: "TRANSPORT_DELIVERY",
    name: "Transportasi & Pengiriman",
    image1: img("TRANSPORT_DELIVERY", "transport", 1),
    image2: img("TRANSPORT_DELIVERY", "transport", 2),
    image3: img("TRANSPORT_DELIVERY", "transport", 3),
  },
  {
    code: "CONSTRUCTION",
    name: "Konstruksi & Renovasi",
    image1: img("CONSTRUCTION", "construction", 1),
    image2: img("CONSTRUCTION", "construction", 2),
    image3: img("CONSTRUCTION", "construction", 3),
  },
  {
    code: "GARDENING",
    name: "Taman & Pertamanan",
    image1: img("GARDENING", "gardening", 1),
    image2: img("GARDENING", "gardening", 2),
    image3: img("GARDENING", "gardening", 3),
  },
  {
    code: "PET_CARE",
    name: "Perawatan Hewan",
    image1: img("PET_CARE", "pet-care", 1),
    image2: img("PET_CARE", "pet-care", 2),
    image3: img("PET_CARE", "pet-care", 3),
  },
  {
    code: "TECH_DIGITAL",
    name: "Teknologi Digital",
    image1: img("TECH_DIGITAL", "tech", 1),
    image2: img("TECH_DIGITAL", "tech", 2),
    image3: img("TECH_DIGITAL", "tech", 3),
  },
]

export async function seedJobCategories() {
    for (const item of jobCategoriesSeed) {
        imgVal.imageWebpIsExist(item.image1)
        imgVal.imageWebpIsExist(item.image2)
        imgVal.imageWebpIsExist(item.image3)
        await prismaClient.jobCategories.upsert ({
            where: {
                code: item.code
            },
            update: {
                name: item.name,
                image1: item.image1,
                image2: item.image2,
                image3: item.image3
            },
            create: item,
        })
    }

    console.log("Job Categories seeded")
}

seedJobCategories()
  .catch((e) => {
    console.error("Job Categories failed", e);
    process.exit(1);
  })
  .finally(async () => {
    await prismaClient.$disconnect();
  })