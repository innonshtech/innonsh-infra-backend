import { Request, Response, NextFunction } from 'express';
import { LeaseService } from './lease.service';
import { sendResponse } from '@utils/response.util';
import { 
  createTenantSchema, 
  updateTenantSchema, 
  createAgreementSchema, 
  updateAgreementSchema, 
  collectRentSchema 
} from './lease.dto';

export class LeaseController {
  private service: LeaseService;

  constructor() {
    this.service = new LeaseService();
  }

  // --- Tenant Handlers ---

  getAllTenants = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.getAllTenants(req.user!.company_id);
      sendResponse(res, 200, 'Tenants fetched successfully', data);
    } catch (error) {
      next(error);
    }
  };

  getTenantById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.getTenantById(req.params.id as string, req.user!.company_id);
      sendResponse(res, 200, 'Tenant details fetched successfully', data);
    } catch (error) {
      next(error);
    }
  };

  createTenant = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = createTenantSchema.parse(req.body);
      const data = await this.service.createTenant(req.user!.company_id, validatedData);
      sendResponse(res, 201, 'Tenant created successfully', data);
    } catch (error) {
      next(error);
    }
  };

  updateTenant = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = updateTenantSchema.parse(req.body);
      await this.service.updateTenant(req.params.id as string, req.user!.company_id, validatedData);
      sendResponse(res, 200, 'Tenant updated successfully');
    } catch (error) {
      next(error);
    }
  };

  deleteTenant = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.service.deleteTenant(req.params.id as string, req.user!.company_id);
      sendResponse(res, 200, 'Tenant deleted successfully');
    } catch (error) {
      next(error);
    }
  };

  // --- Agreement Handlers ---

  getAllAgreements = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.getAllAgreements(req.user!.company_id);
      sendResponse(res, 200, 'Lease agreements fetched successfully', data);
    } catch (error) {
      next(error);
    }
  };

  createAgreement = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = createAgreementSchema.parse(req.body);
      const data = await this.service.createAgreement(req.user!.company_id, validatedData);
      sendResponse(res, 201, 'Lease agreement created successfully', data);
    } catch (error) {
      next(error);
    }
  };

  updateAgreement = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = updateAgreementSchema.parse(req.body);
      const data = await this.service.updateAgreement(req.params.id as string, req.user!.company_id, validatedData);
      sendResponse(res, 200, 'Lease agreement updated successfully', data);
    } catch (error) {
      next(error);
    }
  };

  // --- Rent Collection Handlers ---

  getRentCollections = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.getAllCollections(req.user!.company_id);
      sendResponse(res, 200, 'Rent collections fetched successfully', data);
    } catch (error) {
      next(error);
    }
  };

  collectRent = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = collectRentSchema.parse(req.body);
      const data = await this.service.recordCollection(req.user!.company_id, validatedData);
      sendResponse(res, 201, 'Rent collection recorded successfully', data);
    } catch (error) {
      next(error);
    }
  };
}
