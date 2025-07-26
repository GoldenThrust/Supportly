import { Router } from 'express';
import supportSessionController from '../controllers/supportSessionController.js';
const router = Router();

router.post('/book', supportSessionController.bookSession);

export default router;