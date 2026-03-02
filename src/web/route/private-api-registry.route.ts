import express from "express"
import { AuthMiddleware } from "../middleware/auth.middleware"
import { AuthController } from "../../controller/auth.controller"
import { JobCategoriesController } from "../../controller/job-categories.controller"
import { ProvincesController } from "../../controller/provinces.controller"
import { CitiesController } from "../../controller/cities.controller"
import { DistrictsController } from "../../controller/districts.controller"
import { SubDistrictsController } from "../../controller/sub-districts.controller"
import { AddressesController } from "../../controller/addresses.controller"
import { JobsController } from "../../controller/jobs.controller"

export const privateRouter = express.Router()
privateRouter.use(AuthMiddleware.checkAuthorization)

// auth
privateRouter.post("/api/auth/logout", AuthController.logout)

// job categories
privateRouter.get("/api/jobCategories/:jobCategoryId", JobCategoriesController.get)
privateRouter.get("/api/jobCategories", JobCategoriesController.getAll)

// provinces
privateRouter.get("/api/provinces/:provinceId", ProvincesController.get)
privateRouter.get("/api/provinces", ProvincesController.getAll)

// cities
privateRouter.get("/api/cities/:cityId", CitiesController.get)
privateRouter.get("/api/cities", CitiesController.getAll)
privateRouter.get("/api/provinces/:provinceId/cities", CitiesController.getByProvince)

// districs
privateRouter.get("/api/districts/:districtId", DistrictsController.get) 
privateRouter.get("/api/districts", DistrictsController.getAll)
privateRouter.get("/api/cities/:cityId/districts", DistrictsController.getByCity)

// sub districts
privateRouter.get("/api/subDistricts/:subDistrictId", SubDistrictsController.get)
privateRouter.get("/api/subDistricts", SubDistrictsController.getAll)
privateRouter.get("/api/districts/:districtId/subDistricts", SubDistrictsController.getByDistrict)

// addresses
privateRouter.get("/api/addresses", AddressesController.getAll)
privateRouter.post("/api/addresses", AddressesController.create)
privateRouter.get("/api/addresses/:addressId", AddressesController.get)
privateRouter.patch("/api/addresses/:addressId", AddressesController.update)
privateRouter.delete("/api/addresses/:addressId", AddressesController.delete)

// jobs
privateRouter.post("/api/jobs", JobsController.create)
privateRouter.get("/api/jobs/provider", JobsController.listMyCreatedJobs)
privateRouter.get("/api/jobs/search", JobsController.searchJobs)
privateRouter.get("/api/jobs/:jobId", JobsController.get)
privateRouter.patch("/api/jobs/:jobId", JobsController.update)
privateRouter.delete("/api/jobs/:jobId", JobsController.delete)