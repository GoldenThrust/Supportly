import { Router } from 'express';
import supportSessionController from '../controllers/supportSessionController.js';
import { sessionValidation, validate } from '../middlewares/validator.js';
import { authenticate } from '../middlewares/tokenManager.js';
const router = Router();

router.use(authenticate);

router.get('/all', supportSessionController.fetchSessions);
router.get('/:id', supportSessionController.fetchSession);
router.post('/', validate(sessionValidation), supportSessionController.createSession);
router.put('/:sessionId', supportSessionController.updateSession);
router.patch('/:sessionId/assign', supportSessionController.assignAgent);
router.patch('/:sessionId/status', supportSessionController.updateSessionStatus);

export default router;
