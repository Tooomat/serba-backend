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
import { ReviewsController } from "../../controller/reviews.controller"
import { privateReadRateLimit, privateCUDRateLimit } from "../middleware/security.middleware"

export const privateRouter = Router()
privateRouter.use(AuthMiddleware.checkAuthorization)

// auth
privateRouter.post("/api/auth/logout", privateCUDRateLimit, AuthController.logout)

//user
privateRouter.get("/api/users/current", privateReadRateLimit, UsersController.current)

// job categories
privateRouter.get("/api/jobCategories/:jobCategoryId", privateReadRateLimit, JobCategoriesController.get)
privateRouter.get("/api/jobCategories", privateReadRateLimit, JobCategoriesController.getAll)

// provinces
privateRouter.get("/api/provinces/:provinceId", privateReadRateLimit, ProvincesController.get)
privateRouter.get("/api/provinces", privateReadRateLimit, ProvincesController.getAll)

// cities
privateRouter.get("/api/cities/:cityId", privateReadRateLimit, CitiesController.get)
privateRouter.get("/api/cities", privateReadRateLimit, CitiesController.getAll)
privateRouter.get("/api/provinces/:provinceId/cities", privateReadRateLimit, CitiesController.getByProvince)

// districs
privateRouter.get("/api/districts/:districtId", privateReadRateLimit, DistrictsController.get) 
privateRouter.get("/api/districts", privateReadRateLimit, DistrictsController.getAll)
privateRouter.get("/api/cities/:cityId/districts", privateReadRateLimit, DistrictsController.getByCity)

// sub districts
privateRouter.get("/api/subDistricts/:subDistrictId", privateReadRateLimit, SubDistrictsController.get)
privateRouter.get("/api/subDistricts", privateReadRateLimit, SubDistrictsController.getAll)
privateRouter.get("/api/districts/:districtId/subDistricts", privateReadRateLimit, SubDistrictsController.getByDistrict)

// addresses
privateRouter.get("/api/addresses", privateReadRateLimit, AddressesController.getAll)
privateRouter.post("/api/addresses", privateCUDRateLimit, AddressesController.create)
privateRouter.get("/api/addresses/:addressId", privateReadRateLimit, AddressesController.get)
privateRouter.patch("/api/addresses/:addressId", privateCUDRateLimit, AddressesController.update)
privateRouter.delete("/api/addresses/:addressId", privateCUDRateLimit, AddressesController.delete)

// jobs
privateRouter.post("/api/jobs", privateCUDRateLimit, JobsController.create)
privateRouter.get("/api/jobs/provider", privateReadRateLimit, JobsController.listMyCreatedJobs)
privateRouter.get("/api/jobs/search", privateReadRateLimit, JobsController.searchJobs)
privateRouter.get("/api/jobs/:jobId", privateReadRateLimit, JobsController.get)
privateRouter.patch("/api/jobs/:jobId", privateCUDRateLimit, JobsController.update)
privateRouter.delete("/api/jobs/:jobId", privateCUDRateLimit, JobsController.delete)

// boorkmarks
privateRouter.post("/api/jobs/:jobId/bookmarks", privateCUDRateLimit, BookmarkController.add)
privateRouter.get("/api/bookmarks", privateReadRateLimit, BookmarkController.list)
privateRouter.delete("/api/bookmarks/:bookmarkId", privateCUDRateLimit, BookmarkController.delete)

// job application
privateRouter.post("/api/jobs/:jobId/jobApplications", privateCUDRateLimit, JobApplicationController.create)
privateRouter.patch("/api/jobApplications/:jobApplicationId/status", privateCUDRateLimit, JobApplicationController.updateStatus)
privateRouter.get("/api/jobApplications/:jobApplicationId", privateReadRateLimit, JobApplicationController.getDetail)
privateRouter.get("/api/jobs/:jobId/jobApplications", privateReadRateLimit, JobApplicationController.getListForJobProvider)
privateRouter.get("/api/jobApplications", privateReadRateLimit, JobApplicationController.getListForWorker)

// reviews
privateRouter.post("/api/jobApplications/:jobApplicationId/reviews", privateCUDRateLimit, ReviewsController.create)
privateRouter.post("/api/reviews/:reviewId/reply", privateCUDRateLimit, ReviewsController.reply)
privateRouter.get("/api/users/reviews", privateReadRateLimit, ReviewsController.getListSelf)
privateRouter.get("/api/users/:userId/reviews", privateReadRateLimit, ReviewsController.getListVisitor)
privateRouter.patch("/api/reviews/:reviewId", privateCUDRateLimit, ReviewsController.update)
privateRouter.patch("/api/reviews/:reviewId/reply", privateCUDRateLimit, ReviewsController.updateReply)
privateRouter.delete("/api/reviews/:reviewId", privateCUDRateLimit, ReviewsController.delete)
privateRouter.delete("/api/reviews/:reviewId/reply", privateCUDRateLimit, ReviewsController.deleteReply)

// notifications
privateRouter.get("/api/notifications", privateReadRateLimit, NotificationsController.list)
privateRouter.put("/api/notifications/:notificationId", privateCUDRateLimit, NotificationsController.update)
privateRouter.put("/api/notifications", privateCUDRateLimit, NotificationsController.markAllAsRead)
privateRouter.delete("/api/notifications/:notificationId", privateCUDRateLimit, NotificationsController.delete)