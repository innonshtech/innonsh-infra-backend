import { InventoryRepository } from './inventory.repository';
import { CreateInventoryItemDTO, UpdateInventoryItemDTO, CreateWarehouseDTO, StockMovementDTO } from './inventory.dto';

export class InventoryService {
  private repository: InventoryRepository;

  constructor() {
    this.repository = new InventoryRepository();
  }

  // --- Inventory Item Logic ---

  async getAllItems(companyId: string) {
    return this.repository.findAllItems(companyId);
  }

  async getItemById(id: string, companyId: string) {
    const item = await this.repository.findItemById(id, companyId);
    if (!item) throw new Error('Inventory item not found');
    return item;
  }

  async createItem(companyId: string, data: CreateInventoryItemDTO) {
    return this.repository.createItem({ ...data, companyId });
  }

  async updateItem(id: string, companyId: string, data: UpdateInventoryItemDTO) {
    return this.repository.updateItem(id, companyId, data);
  }

  async deleteItem(id: string, companyId: string) {
    return this.repository.deleteItem(id, companyId);
  }

  // --- Warehouse Logic ---

  async getAllWarehouses(companyId: string) {
    return this.repository.findAllWarehouses(companyId);
  }

  async createWarehouse(companyId: string, data: CreateWarehouseDTO) {
    return this.repository.createWarehouse({ ...data, companyId });
  }

  // --- Stock Movement Logic ---

  async getStock(companyId: string) {
    return this.repository.getStockByCompany(companyId);
  }

  /**
   * Complex Stock Movement Logic
   * Handles stock increments/decrements and prevents negative stock.
   */
  async processStockMovement(companyId: string, data: StockMovementDTO) {
    const { warehouseId, inventoryItemId, quantity, type } = data;

    // 1. If outgoing (type OUT or negative quantity), check current stock
    if (quantity < 0 || type === 'OUT') {
      const currentStock = await this.repository.findStock(warehouseId, inventoryItemId);
      const absQuantity = Math.abs(quantity);
      
      if (!currentStock || currentStock.quantity < absQuantity) {
        throw new Error(`Insufficient stock in warehouse. Current: ${currentStock?.quantity || 0}`);
      }
    }

    // 2. Wrap in transaction logic (simulated via repository calls)
    // Update stock levels
    await this.repository.updateStock(warehouseId, inventoryItemId, companyId, quantity);

    // 3. Record the historical movement
    return this.repository.recordMovement({ ...data, companyId });
  }

  async getMovements(companyId: string) {
    return this.repository.findAllMovements(companyId);
  }
}

