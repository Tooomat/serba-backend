import { Request, Response, Router } from "express";
import { not_found_handler, success_handler_without_data } from "../http/web-response.http";
import { publicRouter } from "./public-api-registry.route";
import { privateRouter } from "./private-api-registry.route";

const router = Router();

router.get("/", (req: Request, res: Response) => {
  return success_handler_without_data(res, "main routes!", 200);
})

router.get("/ping", (req: Request, res: Response) => {
  return success_handler_without_data(res, "pong!", 200);
});

router.use(publicRouter)
router.use(privateRouter)

router.use((req: Request, res: Response) => {
  console.log(`❌ Route not found: ${req.method} ${req.path}`);
  return not_found_handler(res);
});


export default router;