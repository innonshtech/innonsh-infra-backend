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

// New AI ERP Modules
router.get('/land-plots', controller.getLandPlots);
router.post('/land-analysis', controller.analyzeLandPlot);
router.put('/land-plots/:id', controller.updateLandPlot);

router.get('/jv-agreements', controller.getJVAgreements);
router.post('/jv-analysis', controller.analyzeJVAgreement);
router.put('/jv-agreements/:id/lifecycle', controller.updateJVAgreementLifecycle);

router.get('/feasibility-studies', controller.getFeasibilityStudies);
router.post('/feasibility', controller.calculateFeasibility);

router.get('/approval-tasks', controller.getApprovalTasks);
router.post('/approval-delay', controller.predictApprovalDelay);

router.get('/property-plans', controller.getPropertyPlans);
router.post('/property-planning', controller.generatePropertyPlan);

router.get('/documents', controller.getDocumentCatalog);

export default router;
