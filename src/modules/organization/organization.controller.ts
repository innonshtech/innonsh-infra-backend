import { Request, Response, NextFunction } from 'express';
import { organizationService } from './organization.service';
import { sendResponse } from '../../utils/response.util';
import { 
  updateCompanyProfileSchema, 
  createBranchSchema, 
  updateBranchSchema, 
  createDepartmentSchema, 
  createDesignationSchema, 
  createDocumentSchema, 
  updateSettingsSchema 
} from './organization.dto';

export class OrganizationController {
  // Profile
  getProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user!.company_id;
      const profile = await organizationService.getProfile(companyId);
      sendResponse(res, 200, 'Company profile fetched successfully', profile);
    } catch (error) {
      next(error);
    }
  };

  updateProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user!.company_id;
      const validatedData = updateCompanyProfileSchema.parse(req.body);
      const profile = await organizationService.updateProfile(companyId, validatedData);
      sendResponse(res, 200, 'Company profile updated successfully', profile);
    } catch (error) {
      next(error);
    }
  };

  // Settings
  updateSettings = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user!.company_id;
      const validatedData = updateSettingsSchema.parse(req.body);
      const settings = await organizationService.updateSettings(companyId, validatedData);
      sendResponse(res, 200, 'Company settings updated successfully', settings);
    } catch (error) {
      next(error);
    }
  };

  // Branches
  getBranches = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user!.company_id;
      const branches = await organizationService.getBranches(companyId);
      sendResponse(res, 200, 'Branches fetched successfully', branches);
    } catch (error) {
      next(error);
    }
  };

  createBranch = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user!.company_id;
      const validatedData = createBranchSchema.parse(req.body);
      const branch = await organizationService.createBranch(companyId, validatedData);
      sendResponse(res, 201, 'Branch created successfully', branch);
    } catch (error) {
      next(error);
    }
  };

  updateBranch = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user!.company_id;
      const validatedData = updateBranchSchema.parse(req.body);
      const branch = await organizationService.updateBranch(req.params.id as string, companyId, validatedData);
      sendResponse(res, 200, 'Branch updated successfully', branch);
    } catch (error) {
      next(error);
    }
  };

  deleteBranch = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user!.company_id;
      await organizationService.deleteBranch(req.params.id as string, companyId);
      sendResponse(res, 200, 'Branch deleted successfully');
    } catch (error) {
      next(error);
    }
  };

  // Departments
  getDepartments = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user!.company_id;
      const departments = await organizationService.getDepartments(companyId);
      sendResponse(res, 200, 'Departments fetched successfully', departments);
    } catch (error) {
      next(error);
    }
  };

  createDepartment = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user!.company_id;
      const validatedData = createDepartmentSchema.parse(req.body);
      const department = await organizationService.createDepartment(companyId, validatedData);
      sendResponse(res, 201, 'Department created successfully', department);
    } catch (error) {
      next(error);
    }
  };

  deleteDepartment = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user!.company_id;
      await organizationService.deleteDepartment(req.params.id as string, companyId);
      sendResponse(res, 200, 'Department deleted successfully');
    } catch (error) {
      next(error);
    }
  };

  // Designations
  getDesignations = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user!.company_id;
      const designations = await organizationService.getDesignations(companyId);
      sendResponse(res, 200, 'Designations fetched successfully', designations);
    } catch (error) {
      next(error);
    }
  };

  createDesignation = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user!.company_id;
      const validatedData = createDesignationSchema.parse(req.body);
      const designation = await organizationService.createDesignation(companyId, validatedData);
      sendResponse(res, 201, 'Designation created successfully', designation);
    } catch (error) {
      next(error);
    }
  };

  deleteDesignation = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user!.company_id;
      await organizationService.deleteDesignation(req.params.id as string, companyId);
      sendResponse(res, 200, 'Designation deleted successfully');
    } catch (error) {
      next(error);
    }
  };

  // Documents
  getDocuments = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user!.company_id;
      const documents = await organizationService.getDocuments(companyId);
      sendResponse(res, 200, 'Documents fetched successfully', documents);
    } catch (error) {
      next(error);
    }
  };

  createDocument = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user!.company_id;
      const validatedData = createDocumentSchema.parse(req.body);
      const document = await organizationService.createDocument(companyId, validatedData);
      sendResponse(res, 201, 'Document uploaded/registered successfully', document);
    } catch (error) {
      next(error);
    }
  };

  deleteDocument = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user!.company_id;
      await organizationService.deleteDocument(req.params.id as string, companyId);
      sendResponse(res, 200, 'Document deleted successfully');
    } catch (error) {
      next(error);
    }
  };
}

export const organizationController = new OrganizationController();
