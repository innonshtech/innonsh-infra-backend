import express from 'express';
import { AiController } from './ai.controller';
import { authMiddleware } from '../../middleware/auth.middleware';

const router = express.Router();
const controller = new AiController();

// Apply auth middleware to all AI routes
router.use(authMiddleware);

router.get('/sessions', controller.getSessions);
router.get('/sessions/:id', controller.getSessionById);
router.post('/chat', controller.chat);
router.delete('/sessions/:id', controller.deleteSession);

export default router;
