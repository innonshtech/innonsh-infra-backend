import { Request, Response, NextFunction } from 'express';
import { InventoryService } from './inventory.service';
import { sendResponse } from '../../../utils/response.util';
import { 
  createInventoryItemSchema, 
  updateInventoryItemSchema, 
  createWarehouseSchema, 
  stockMovementSchema 
} from './inventory.dto';

export class InventoryController {
  private service: InventoryService;

  constructor() {
    this.service = new InventoryService();
  }

  // --- Inventory Item Handlers ---

  getAllItems = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.getAllItems(req.user!.company_id);
      sendResponse(res, 200, 'Inventory items fetched', data);
    } catch (error) {
      next(error);
    }
  };

  createItem = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = createInventoryItemSchema.parse(req.body);
      const data = await this.service.createItem(req.user!.company_id, validatedData);
      sendResponse(res, 201, 'Inventory item created', data);
    } catch (error) {
      next(error);
    }
  };

  updateItem = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = updateInventoryItemSchema.parse(req.body);
      await this.service.updateItem(req.params.id as string, req.user!.company_id, validatedData);
      sendResponse(res, 200, 'Inventory item updated');
    } catch (error) {
      next(error);
    }
  };

  deleteItem = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.service.deleteItem(req.params.id as string, req.user!.company_id);
      sendResponse(res, 200, 'Inventory item deleted');
    } catch (error) {
      next(error);
    }
  };

  // --- Warehouse Handlers ---

  getAllWarehouses = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.getAllWarehouses(req.user!.company_id);
      sendResponse(res, 200, 'Warehouses fetched', data);
    } catch (error) {
      next(error);
    }
  };

  createWarehouse = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = createWarehouseSchema.parse(req.body);
      const data = await this.service.createWarehouse(req.user!.company_id, validatedData);
      sendResponse(res, 201, 'Warehouse created', data);
    } catch (error) {
      next(error);
    }
  };

  // --- Stock Handlers ---

  getStock = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.getStock(req.user!.company_id);
      sendResponse(res, 200, 'Stock levels fetched', data);
    } catch (error) {
      next(error);
    }
  };

  processMovement = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = stockMovementSchema.parse(req.body);
      const data = await this.service.processStockMovement(req.user!.company_id, validatedData);
      sendResponse(res, 201, 'Stock movement processed', data);
    } catch (error) {
      next(error);
    }
  };

  getMovements = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.getMovements(req.user!.company_id);
      sendResponse(res, 200, 'Stock movements fetched', data);
    } catch (error) {
      next(error);
    }
  };
}

