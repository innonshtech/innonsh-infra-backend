import { Request, Response, NextFunction } from 'express';
import { ReportsService } from './reports.service';
import { sendResponse } from '@utils/response.util';
import { reportQuerySchema } from './reports.dto';

export class ReportsController {
  private service: ReportsService;

  constructor() {
    this.service = new ReportsService();
  }

  getDashboard = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.getDashboardData(req.user!.company_id);
      sendResponse(res, 200, 'Dashboard statistics fetched successfully', data);
    } catch (error) {
      next(error);
    }
  };

  getSalesReport = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const query = reportQuerySchema.parse(req.query);
      const data = await this.service.getSalesReport(req.user!.company_id, query);
      sendResponse(res, 200, 'Sales report fetched successfully', data);
    } catch (error) {
      next(error);
    }
  };

  getRevenueReport = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const query = reportQuerySchema.parse(req.query);
      const data = await this.service.getRevenueReport(req.user!.company_id, query);
      sendResponse(res, 200, 'Revenue report fetched successfully', data);
    } catch (error) {
      next(error);
    }
  };

  getBookingsReport = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const query = reportQuerySchema.parse(req.query);
      const data = await this.service.getBookingsReport(req.user!.company_id, query);
      sendResponse(res, 200, 'Bookings report fetched successfully', data);
    } catch (error) {
      next(error);
    }
  };

  getDuesReport = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const query = reportQuerySchema.parse(req.query);
      const data = await this.service.getDuesReport(req.user!.company_id, query);
      sendResponse(res, 200, 'Aging dues report fetched successfully', data);
    } catch (error) {
      next(error);
    }
  };
}
