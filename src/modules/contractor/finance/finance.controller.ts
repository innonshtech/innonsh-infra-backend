import { Request, Response, NextFunction } from 'express';
import { FinanceService } from './finance.service';
import { sendResponse } from '@utils/response.util';
import { 
  createInvoiceSchema, 
  updateInvoiceSchema, 
  createTransactionSchema, 
  createPaymentSchema 
} from './finance.dto';

export class FinanceController {
  private service: FinanceService;

  constructor() {
    this.service = new FinanceService();
  }

  // --- Transactions ---

  getAllTransactions = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.getAllTransactions(req.user!.company_id);
      sendResponse(res, 200, 'Transactions fetched', data);
    } catch (error) {
      next(error);
    }
  };

  createTransaction = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = createTransactionSchema.parse(req.body);
      const data = await this.service.createTransaction(req.user!.company_id, validatedData);
      sendResponse(res, 201, 'Transaction recorded', data);
    } catch (error) {
      next(error);
    }
  };

  // --- Invoices ---

  getAllInvoices = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.getAllInvoices(req.user!.company_id);
      sendResponse(res, 200, 'Invoices fetched', data);
    } catch (error) {
      next(error);
    }
  };

  createInvoice = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = createInvoiceSchema.parse(req.body);
      const data = await this.service.createInvoice(req.user!.company_id, validatedData);
      sendResponse(res, 201, 'Invoice created', data);
    } catch (error) {
      next(error);
    }
  };

  updateInvoice = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = updateInvoiceSchema.parse(req.body);
      await this.service.updateInvoice(req.params.id as string, req.user!.company_id, validatedData);
      sendResponse(res, 200, 'Invoice updated');
    } catch (error) {
      next(error);
    }
  };

  deleteInvoice = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.service.deleteInvoice(req.params.id as string, req.user!.company_id);
      sendResponse(res, 200, 'Invoice deleted');
    } catch (error) {
      next(error);
    }
  };

  // --- Payments ---

  getAllPayments = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.getAllPayments(req.user!.company_id);
      sendResponse(res, 200, 'Payments fetched', data);
    } catch (error) {
      next(error);
    }
  };

  recordPayment = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = createPaymentSchema.parse(req.body);
      const data = await this.service.recordPayment(req.user!.company_id, validatedData);
      sendResponse(res, 201, 'Payment recorded and linked to transaction', data);
    } catch (error) {
      next(error);
    }
  };
}
