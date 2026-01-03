import { Router } from "express";
import { UserController } from "./user.controller";
import { loginSchema, registerSchema } from "./user.schema";
import { validate } from "../../shared/middleware/validate";
import { requireAuth } from "../../shared/middleware/authMiddleware";

const router = Router();
const controller = new UserController();

router.post("/register", validate(registerSchema),  controller.register);
router.post("/login", validate(loginSchema), controller.login);
router.get("/me", requireAuth , controller.getMe);

export const userRoutes = router;
