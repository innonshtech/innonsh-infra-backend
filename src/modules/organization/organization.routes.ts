import express from 'express';
import { organizationController } from './organization.controller';
import { authMiddleware } from '../../middleware/auth.middleware';

const router = express.Router();

// Company Profile & Settings
router.get('/profile', authMiddleware, organizationController.getProfile);
router.put('/profile', authMiddleware, organizationController.updateProfile);
router.put('/settings', authMiddleware, organizationController.updateSettings);

// Branches
router.get('/branches', authMiddleware, organizationController.getBranches);
router.post('/branches', authMiddleware, organizationController.createBranch);
router.put('/branches/:id', authMiddleware, organizationController.updateBranch);
router.delete('/branches/:id', authMiddleware, organizationController.deleteBranch);

// Departments
router.get('/departments', authMiddleware, organizationController.getDepartments);
router.post('/departments', authMiddleware, organizationController.createDepartment);
router.delete('/departments/:id', authMiddleware, organizationController.deleteDepartment);

// Designations
router.get('/designations', authMiddleware, organizationController.getDesignations);
router.post('/designations', authMiddleware, organizationController.createDesignation);
router.put('/designations/:id', authMiddleware, organizationController.updateDesignation);
router.delete('/designations/:id', authMiddleware, organizationController.deleteDesignation);

// Company Documents
router.get('/documents', authMiddleware, organizationController.getDocuments);
router.post('/documents', authMiddleware, organizationController.createDocument);
router.delete('/documents/:id', authMiddleware, organizationController.deleteDocument);

export default router;
