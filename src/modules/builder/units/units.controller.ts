import { Request, Response, NextFunction } from 'express';
import { UnitsService } from './units.service';
import { sendResponse } from '@utils/response.util';
import { 
  createUnitSchema, 
  updateUnitSchema, 
  updateUnitStatusSchema, 
  updateUnitPriceSchema 
} from './units.dto';

export class UnitsController {
  private service: UnitsService;

  constructor() {
    this.service = new UnitsService();
  }

  getAllUnits = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.getAllUnits(req.user!.company_id);
      sendResponse(res, 200, 'Units fetched successfully', data);
    } catch (error) {
      next(error);
    }
  };

  getUnitById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.getUnitById(req.params.id as string, req.user!.company_id);
      sendResponse(res, 200, 'Unit details fetched successfully', data);
    } catch (error) {
      next(error);
    }
  };

  createUnit = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = createUnitSchema.parse(req.body);
      const data = await this.service.createUnit(req.user!.company_id, validatedData);
      sendResponse(res, 201, 'Unit created successfully', data);
    } catch (error) {
      next(error);
    }
  };

  updateUnit = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = updateUnitSchema.parse(req.body);
      await this.service.updateUnit(req.params.id as string, req.user!.company_id, validatedData);
      sendResponse(res, 200, 'Unit updated successfully');
    } catch (error) {
      next(error);
    }
  };

  deleteUnit = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.service.deleteUnit(req.params.id as string, req.user!.company_id);
      sendResponse(res, 200, 'Unit deleted successfully');
    } catch (error) {
      next(error);
    }
  };

  updateStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = updateUnitStatusSchema.parse(req.body);
      const data = await this.service.updateUnitStatus(
        req.params.id as string, 
        req.user!.company_id, 
        req.user!.id, 
        validatedData
      );
      sendResponse(res, 200, 'Unit status updated and history recorded', data);
    } catch (error) {
      next(error);
    }
  };

  getHistory = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.getUnitHistory(req.params.id as string, req.user!.company_id);
      sendResponse(res, 200, 'Unit status history fetched', data);
    } catch (error) {
      next(error);
    }
  };

  getPricing = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.getUnitPricing(req.params.id as string, req.user!.company_id);
      sendResponse(res, 200, 'Unit pricing logs fetched', data);
    } catch (error) {
      next(error);
    }
  };

  updatePricing = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = updateUnitPriceSchema.parse(req.body);
      const data = await this.service.updateUnitPrice(
        req.params.id as string, 
        req.user!.company_id, 
        req.user!.id, 
        validatedData
      );
      sendResponse(res, 200, 'Unit price updated and log recorded', data);
    } catch (error) {
      next(error);
    }
  };
}
