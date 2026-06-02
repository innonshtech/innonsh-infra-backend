import { Request, Response, NextFunction } from 'express';
import { BrokerService } from './broker.service';
import { sendResponse } from '@utils/response.util';
import { createBrokerSchema, updateBrokerSchema } from './broker.dto';

export class BrokerController {
  private service: BrokerService;

  constructor() {
    this.service = new BrokerService();
  }

  getAllBrokers = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.getAllBrokers(req.user!.company_id);
      sendResponse(res, 200, 'Brokers fetched successfully', data);
    } catch (error) {
      next(error);
    }
  };

  getBrokerById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.getBrokerById(req.params.id as string, req.user!.company_id);
      sendResponse(res, 200, 'Broker details fetched successfully', data);
    } catch (error) {
      next(error);
    }
  };

  createBroker = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = createBrokerSchema.parse(req.body);
      const data = await this.service.createBroker(req.user!.company_id, validatedData);
      sendResponse(res, 201, 'Broker created successfully', data);
    } catch (error) {
      next(error);
    }
  };

  updateBroker = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = updateBrokerSchema.parse(req.body);
      await this.service.updateBroker(req.params.id as string, req.user!.company_id, validatedData);
      sendResponse(res, 200, 'Broker updated successfully');
    } catch (error) {
      next(error);
    }
  };

  deleteBroker = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.service.deleteBroker(req.params.id as string, req.user!.company_id);
      sendResponse(res, 200, 'Broker deleted successfully');
    } catch (error) {
      next(error);
    }
  };

  getBrokerClients = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.getBrokerClients(req.params.id as string, req.user!.company_id);
      sendResponse(res, 200, 'Broker clients fetched successfully', data);
    } catch (error) {
      next(error);
    }
  };
}
