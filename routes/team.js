import { Router } from "express";
import { authenticate } from "../middlewares/tokenManager.js";
import teamController from "../controllers/teamController.js";

const router = Router();

router.use(authenticate);

router.get('/', teamController.fetchTeams);

export default router;