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
import { privateReadRateLimit, privateCUDRateLimit, authPhoneSendRateLimiter, authPhoneVerifRateLimiter } from "../middleware/security.middleware"
import { uploadProfilePict } from "../middleware/upload.middleware"
import { Verification } from "../middleware/verification.middleware"
import { ProfileMiddleware } from "../middleware/profile.middleware"
import { PhoneVerificationController } from "../../controller/phone-verifications.controller"
export const privateRouter = Router()
privateRouter.use(AuthMiddleware.checkAuthorization)

// auth
privateRouter.post("/api/auth/logout", privateCUDRateLimit, AuthController.logout)

// phone verification 
privateRouter.post("/api/otp/phone/send", authPhoneSendRateLimiter, PhoneVerificationController.send)
privateRouter.post("/api/otp/phone/verify", authPhoneVerifRateLimiter, PhoneVerificationController.verify)
//user
privateRouter.get("/api/users/current", privateReadRateLimit, Verification.requireEmailVerified, UsersController.current)
privateRouter.patch("/api/users", privateCUDRateLimit, Verification.requireEmailVerified, UsersController.update)
privateRouter.patch("/api/users/profilePicture", privateCUDRateLimit, Verification.requireEmailVerified, uploadProfilePict.single("profilePict"), UsersController.updateProfilePict)
privateRouter.get("/api/users/profile", privateReadRateLimit, Verification.requireEmailVerified, UsersController.ownProfile)
privateRouter.get("/api/users/:userId/profile", privateReadRateLimit, Verification.requireEmailVerified, UsersController.otherProfile)
privateRouter.delete("/api/users/profilePicture", privateCUDRateLimit, Verification.requireEmailVerified, UsersController.deleteProfilePict)

// job categories
privateRouter.get("/api/jobCategories/:jobCategoryId", privateReadRateLimit, Verification.requireEmailVerified, JobCategoriesController.get)
privateRouter.get("/api/jobCategories", privateReadRateLimit, Verification.requireEmailVerified, JobCategoriesController.getAll)

// provinces
privateRouter.get("/api/provinces/:provinceId", privateReadRateLimit, Verification.requireEmailVerified, ProvincesController.get)
privateRouter.get("/api/provinces", privateReadRateLimit, Verification.requireEmailVerified, ProvincesController.getAll)

// cities
privateRouter.get("/api/cities/:cityId", privateReadRateLimit, Verification.requireEmailVerified, CitiesController.get)
privateRouter.get("/api/cities", privateReadRateLimit, Verification.requireEmailVerified, CitiesController.getAll)
privateRouter.get("/api/provinces/:provinceId/cities", privateReadRateLimit, Verification.requireEmailVerified, CitiesController.getByProvince)

// districs
privateRouter.get("/api/districts/:districtId", privateReadRateLimit, Verification.requireEmailVerified, DistrictsController.get) 
privateRouter.get("/api/districts", privateReadRateLimit, Verification.requireEmailVerified, DistrictsController.getAll)
privateRouter.get("/api/cities/:cityId/districts", privateReadRateLimit, Verification.requireEmailVerified, DistrictsController.getByCity)

// sub districts
privateRouter.get("/api/subDistricts/:subDistrictId", privateReadRateLimit, Verification.requireEmailVerified, SubDistrictsController.get)
privateRouter.get("/api/subDistricts", privateReadRateLimit, Verification.requireEmailVerified, SubDistrictsController.getAll)
privateRouter.get("/api/districts/:districtId/subDistricts", privateReadRateLimit, Verification.requireEmailVerified, SubDistrictsController.getByDistrict)

// addresses
privateRouter.get("/api/addresses", privateReadRateLimit, Verification.requireEmailVerified, AddressesController.getAll)
privateRouter.post("/api/addresses", privateCUDRateLimit, Verification.requireEmailVerified, AddressesController.create)
privateRouter.get("/api/addresses/:addressId", privateReadRateLimit, Verification.requireEmailVerified, AddressesController.get)
privateRouter.patch("/api/addresses/:addressId", privateCUDRateLimit, Verification.requireEmailVerified, AddressesController.update)
privateRouter.delete("/api/addresses/:addressId", privateCUDRateLimit, Verification.requireEmailVerified, AddressesController.delete)

// jobs
privateRouter.post("/api/jobs", privateCUDRateLimit ,Verification.requireEmailVerified, ProfileMiddleware.requireCompleteProfile, JobsController.create)
privateRouter.get("/api/jobs/provider", privateReadRateLimit, Verification.requireEmailVerified, JobsController.listMyCreatedJobs)
privateRouter.get("/api/jobs/search", privateReadRateLimit, Verification.requireEmailVerified, JobsController.searchJobs)
privateRouter.get("/api/jobs/:jobId", privateReadRateLimit, Verification.requireEmailVerified, JobsController.get)
privateRouter.patch("/api/jobs/:jobId", privateCUDRateLimit, Verification.requireEmailVerified, JobsController.update)
privateRouter.delete("/api/jobs/:jobId", privateCUDRateLimit, Verification.requireEmailVerified, JobsController.delete)

// boorkmarks
privateRouter.post("/api/jobs/:jobId/bookmarks", privateCUDRateLimit, Verification.requireEmailVerified, BookmarkController.add)
privateRouter.get("/api/bookmarks", privateReadRateLimit, Verification.requireEmailVerified, BookmarkController.list)
privateRouter.delete("/api/bookmarks/:bookmarkId", privateCUDRateLimit, Verification.requireEmailVerified, BookmarkController.delete)

// job application
privateRouter.post("/api/jobs/:jobId/jobApplications", privateCUDRateLimit, ProfileMiddleware.requireCompleteProfile, Verification.requireEmailVerified, JobApplicationController.create)
privateRouter.patch("/api/jobApplications/:jobApplicationId/status", privateCUDRateLimit, Verification.requireEmailVerified, JobApplicationController.updateStatus)
privateRouter.get("/api/jobApplications/:jobApplicationId", privateReadRateLimit, Verification.requireEmailVerified, JobApplicationController.getDetail)
privateRouter.get("/api/jobs/:jobId/jobApplications", privateReadRateLimit, Verification.requireEmailVerified, JobApplicationController.getListForJobProvider)
privateRouter.get("/api/jobApplications", privateReadRateLimit, Verification.requireEmailVerified, JobApplicationController.getListForWorker)

// reviews
privateRouter.post("/api/jobApplications/:jobApplicationId/reviews", privateCUDRateLimit, Verification.requireEmailVerified, ProfileMiddleware.requireCompleteProfile, ReviewsController.create)
privateRouter.post("/api/reviews/:reviewId/reply", privateCUDRateLimit, Verification.requireEmailVerified, ReviewsController.reply)
privateRouter.get("/api/reviews", privateReadRateLimit, Verification.requireEmailVerified, ReviewsController.getListSelf)
privateRouter.get("/api/users/:userId/reviews", privateReadRateLimit, Verification.requireEmailVerified, ReviewsController.getListVisitor)
privateRouter.patch("/api/reviews/:reviewId", privateCUDRateLimit, Verification.requireEmailVerified, ReviewsController.update)
privateRouter.patch("/api/reviews/:reviewId/reply", privateCUDRateLimit, Verification.requireEmailVerified, ReviewsController.updateReply)
privateRouter.delete("/api/reviews/:reviewId", privateCUDRateLimit, Verification.requireEmailVerified, ReviewsController.delete)
privateRouter.delete("/api/reviews/:reviewId/reply", privateCUDRateLimit, Verification.requireEmailVerified, ReviewsController.deleteReply)

// notifications
privateRouter.get("/api/notifications", privateReadRateLimit, Verification.requireEmailVerified, NotificationsController.list)
privateRouter.put("/api/notifications/:notificationId", privateCUDRateLimit, Verification.requireEmailVerified, NotificationsController.update)
privateRouter.put("/api/notifications", privateCUDRateLimit, Verification.requireEmailVerified, NotificationsController.markAllAsRead)
privateRouter.delete("/api/notifications/:notificationId", privateCUDRateLimit, Verification.requireEmailVerified, NotificationsController.delete)