import { Request, Response, NextFunction } from 'express';
import { LegalService } from './legal.service';
import { sendResponse } from '@utils/response.util';
import { 
  createLegalDocumentSchema, 
  updateLegalDocumentSchema, 
  createLegalApprovalSchema, 
  createComplianceRecordSchema 
} from './legal.dto';

export class LegalController {
  private service: LegalService;

  constructor() {
    this.service = new LegalService();
  }

  // --- Document Handlers ---

  getAllDocuments = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.getAllDocuments(req.user!.company_id);
      sendResponse(res, 200, 'Legal documents fetched successfully', data);
    } catch (error) {
      next(error);
    }
  };

  getDocumentById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.getDocumentById(req.params.id as string, req.user!.company_id);
      sendResponse(res, 200, 'Legal document details fetched successfully', data);
    } catch (error) {
      next(error);
    }
  };

  createDocument = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = createLegalDocumentSchema.parse(req.body);
      const data = await this.service.createDocument(req.user!.company_id, validatedData);
      sendResponse(res, 21, 'Legal document recorded successfully', data);
    } catch (error) {
      next(error);
    }
  };

  updateDocument = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = updateLegalDocumentSchema.parse(req.body);
      await this.service.updateDocument(req.params.id as string, req.user!.company_id, validatedData);
      sendResponse(res, 200, 'Legal document updated successfully');
    } catch (error) {
      next(error);
    }
  };

  deleteDocument = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.service.deleteDocument(req.params.id as string, req.user!.company_id);
      sendResponse(res, 200, 'Legal document deleted successfully');
    } catch (error) {
      next(error);
    }
  };

  // --- Approval Handlers ---

  getAllApprovals = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.getAllApprovals(req.user!.company_id);
      sendResponse(res, 200, 'Legal approvals fetched successfully', data);
    } catch (error) {
      next(error);
    }
  };

  recordApproval = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = createLegalApprovalSchema.parse(req.body);
      const data = await this.service.recordApproval(req.user!.company_id, validatedData);
      sendResponse(res, 201, 'Legal approval recorded successfully', data);
    } catch (error) {
      next(error);
    }
  };

  // --- Compliance Handlers ---

  getAllCompliance = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.getAllCompliance(req.user!.company_id);
      sendResponse(res, 200, 'Compliance records fetched successfully', data);
    } catch (error) {
      next(error);
    }
  };

  recordCompliance = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = createComplianceRecordSchema.parse(req.body);
      const data = await this.service.recordCompliance(req.user!.company_id, validatedData);
      sendResponse(res, 201, 'Compliance record saved successfully', data);
    } catch (error) {
      next(error);
    }
  };
}
