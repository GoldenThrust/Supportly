import { Router } from 'express';
import supportSessionController from '../controllers/supportSessionController.js';
import { sessionValidation, validate } from '../middlewares/validator.js';
import { authenticate } from '../middlewares/tokenManager.js';
const router = Router();

router.use(authenticate);

router.get('/', supportSessionController.fetchSession);
router.get('/all', supportSessionController.fetchSessions);
router.post('/', validate(sessionValidation), supportSessionController.createSession);

export default router;