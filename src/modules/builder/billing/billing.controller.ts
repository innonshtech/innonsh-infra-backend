import { Request, Response, NextFunction } from 'express';
import { BillingService } from './billing.service';
import { sendResponse } from '@utils/response.util';
import { createInvoiceSchema, updateInvoiceSchema, recordPaymentSchema } from './billing.dto';

export class BillingController {
  private service: BillingService;

  constructor() {
    this.service = new BillingService();
  }

  // --- Invoice Handlers ---

  getAllInvoices = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.getAllInvoices(req.user!.company_id);
      sendResponse(res, 200, 'Invoices fetched successfully', data);
    } catch (error) {
      next(error);
    }
  };

  getInvoiceById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.getInvoiceById(req.params.id as string, req.user!.company_id);
      sendResponse(res, 200, 'Invoice details fetched successfully', data);
    } catch (error) {
      next(error);
    }
  };

  createInvoice = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = createInvoiceSchema.parse(req.body);
      const data = await this.service.createInvoice(req.user!.company_id, validatedData);
      sendResponse(res, 201, 'Invoice created successfully', data);
    } catch (error) {
      next(error);
    }
  };

  updateInvoice = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = updateInvoiceSchema.parse(req.body);
      await this.service.updateInvoice(req.params.id as string, req.user!.company_id, validatedData);
      sendResponse(res, 200, 'Invoice updated successfully');
    } catch (error) {
      next(error);
    }
  };

  deleteInvoice = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.service.deleteInvoice(req.params.id as string, req.user!.company_id);
      sendResponse(res, 200, 'Invoice deleted successfully');
    } catch (error) {
      next(error);
    }
  };

  // --- Payment Handlers ---

  getAllPayments = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.getAllPayments(req.user!.company_id);
      sendResponse(res, 200, 'Payments fetched successfully', data);
    } catch (error) {
      next(error);
    }
  };

  recordPayment = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = recordPaymentSchema.parse(req.body);
      const data = await this.service.recordPayment(req.user!.company_id, validatedData);
      sendResponse(res, 201, 'Payment recorded successfully', data);
    } catch (error) {
      next(error);
    }
  };

  // --- Special GET Handlers ---

  getDues = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.getPendingDues(req.user!.company_id);
      sendResponse(res, 200, 'Pending dues fetched successfully', data);
    } catch (error) {
      next(error);
    }
  };

  getReports = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.getFinancialReports(req.user!.company_id);
      sendResponse(res, 200, 'Billing summary reports fetched successfully', data);
    } catch (error) {
      next(error);
    }
  };
}
