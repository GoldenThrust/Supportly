import { Router } from "express";
import { authenticate } from "../middlewares/tokenManager.js";
import userController from "../controllers/userController.js";

const router = Router();

router.use(authenticate);

router.get('/', userController.fetchUsers);

export default router;