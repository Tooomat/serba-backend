import { Router } from "express"
import { AuthMiddleware } from "../middleware/auth.middleware"
import { AuthController } from "../../controller/auth.controller"
import { JobCategoriesController } from "../../controller/job-categories.controller"
import { ProvincesController } from "../../controller/provinces.controller"
import { CitiesController } from "../../controller/cities.controller"
import { DistrictsController } from "../../controller/districts.controller"
import { SubDistrictsController } from "../../controller/sub-districts.controller"
import { AddressesController } from "../../controller/addresses.controller"
import { JobsController } from "../../controller/jobs.controller"
import { UsersController } from "../../controller/users.controller"
import { JobApplicationController } from "../../controller/job-application.controller"
import { NotificationsController } from "../../controller/notifications.controller"
import { BookmarkController } from "../../controller/bookmarks.controller"

export const privateRouter = Router()
privateRouter.use(AuthMiddleware.checkAuthorization)

// auth
privateRouter.post("/api/auth/logout", AuthController.logout)

//user
privateRouter.get("/api/users/current", UsersController.current)

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

// boorkmarks
privateRouter.post("/api/jobs/:jobId/bookmarks", BookmarkController.add)
privateRouter.get("/api/bookmarks", BookmarkController.list)
privateRouter.delete("/api/bookmarks/:bookmarkId", BookmarkController.delete)

// job application
privateRouter.post("/api/jobs/:jobId/jobApplications", JobApplicationController.create)
privateRouter.patch("/api/jobApplications/:jobApplicationId/status", JobApplicationController.updateStatus)
privateRouter.get("/api/jobApplications/:jobApplicationId", JobApplicationController.getDetail)
privateRouter.get("/api/jobs/:jobId/jobApplications", JobApplicationController.getListForJobProvider)
privateRouter.get("/api/jobApplications", JobApplicationController.getListForWorker)

// reviews


// notifications
privateRouter.get("/api/notifications", NotificationsController.list)
privateRouter.put("/api/notifications/:notificationId", NotificationsController.update)
privateRouter.put("/api/notifications", NotificationsController.markAllAsRead)
privateRouter.delete("/api/notifications/:notificationId", NotificationsController.delete)