import { Request, Response, NextFunction } from 'express';
import { BookingService } from './booking.service';
import { sendResponse } from '@utils/response.util';
import { createBookingSchema, updateBookingSchema, createPaymentPlanSchema } from './booking.dto';

export class BookingController {
  private service: BookingService;

  constructor() {
    this.service = new BookingService();
  }

  getAllBookings = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.getAllBookings(req.user!.company_id);
      sendResponse(res, 200, 'Bookings fetched successfully', data);
    } catch (error) {
      next(error);
    }
  };

  getBookingById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.getBookingById(req.params.id as string, req.user!.company_id);
      sendResponse(res, 200, 'Booking details fetched successfully', data);
    } catch (error) {
      next(error);
    }
  };

  createBooking = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = createBookingSchema.parse(req.body);
      const data = await this.service.createBooking(req.user!.company_id, validatedData);
      sendResponse(res, 21, 'Booking created successfully', data);
    } catch (error) {
      next(error);
    }
  };

  updateBooking = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = updateBookingSchema.parse(req.body);
      await this.service.updateBooking(req.params.id as string, req.user!.company_id, validatedData);
      sendResponse(res, 200, 'Booking updated successfully');
    } catch (error) {
      next(error);
    }
  };

  deleteBooking = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.service.deleteBooking(req.params.id as string, req.user!.company_id);
      sendResponse(res, 200, 'Booking deleted and unit released');
    } catch (error) {
      next(error);
    }
  };

  cancelBooking = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.cancelBooking(req.params.id as string, req.user!.company_id);
      sendResponse(res, 200, 'Booking cancelled and unit released', data);
    } catch (error) {
      next(error);
    }
  };

  confirmBooking = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.confirmBooking(req.params.id as string, req.user!.company_id);
      sendResponse(res, 200, 'Booking confirmed and unit sold', data);
    } catch (error) {
      next(error);
    }
  };

  getPaymentPlan = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.getPaymentPlan(req.params.id as string, req.user!.company_id);
      sendResponse(res, 200, 'Booking payment plan fetched', data);
    } catch (error) {
      next(error);
    }
  };

  savePaymentPlan = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = createPaymentPlanSchema.parse(req.body);
      const data = await this.service.savePaymentPlan(req.params.id as string, req.user!.company_id, validatedData);
      sendResponse(res, 201, 'Payment plan saved successfully', data);
    } catch (error) {
      next(error);
    }
  };
}
