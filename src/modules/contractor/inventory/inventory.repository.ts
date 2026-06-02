import { prisma } from '../../../config/prisma.config';
import { CreateInventoryItemDTO, UpdateInventoryItemDTO, CreateWarehouseDTO, StockMovementDTO } from './inventory.dto';

export class InventoryRepository {
  // --- Inventory Item Repos ---

  async findAllItems(companyId: string) {
    return (prisma as any).inventoryItem.findMany({
      where: { companyId },
      orderBy: { name: 'asc' }
    });
  }

  async findItemById(id: string, companyId: string) {
    return (prisma as any).inventoryItem.findFirst({
      where: { id, companyId }
    });
  }

  async createItem(data: CreateInventoryItemDTO & { companyId: string }) {
    return (prisma as any).inventoryItem.create({
      data
    });
  }

  async updateItem(id: string, companyId: string, data: UpdateInventoryItemDTO) {
    return (prisma as any).inventoryItem.updateMany({
      where: { id, companyId },
      data
    });
  }

  async deleteItem(id: string, companyId: string) {
    return prisma.$transaction(async (tx: any) => {
      // 1. Delete associated stocks
      await (tx as any).stock.deleteMany({
        where: { inventoryItemId: id, companyId }
      });
      // 2. Delete associated stock movements
      await (tx as any).stockMovement.deleteMany({
        where: { inventoryItemId: id, companyId }
      });
      // 3. Delete associated estimation items link
      await (tx as any).estimationItem.updateMany({
        where: { inventoryItemId: id },
        data: { inventoryItemId: null }
      });
      // 4. Delete the item itself
      return (tx as any).inventoryItem.deleteMany({
        where: { id, companyId }
      });
    });
  }

  // --- Warehouse Repos ---

  async findAllWarehouses(companyId: string) {
    return (prisma as any).warehouse.findMany({
      where: { companyId },
      orderBy: { name: 'asc' }
    });
  }

  async createWarehouse(data: CreateWarehouseDTO & { companyId: string }) {
    return (prisma as any).warehouse.create({
      data
    });
  }

  // --- Stock & Movement Repos ---

  async getStockByCompany(companyId: string) {
    return (prisma as any).stock.findMany({
      where: { companyId },
      include: {
        inventoryItem: true,
        warehouse: true
      }
    });
  }

  async findStock(warehouseId: string, inventoryItemId: string) {
    return (prisma as any).stock.findUnique({
      where: {
        warehouseId_inventoryItemId: {
          warehouseId,
          inventoryItemId
        }
      }
    });
  }

  async updateStock(warehouseId: string, inventoryItemId: string, companyId: string, quantityChange: number) {
    return (prisma as any).stock.upsert({
      where: {
        warehouseId_inventoryItemId: {
          warehouseId,
          inventoryItemId
        }
      },
      update: {
        quantity: { increment: quantityChange }
      },
      create: {
        warehouseId,
        inventoryItemId,
        companyId,
        quantity: quantityChange
      }
    });
  }

  async recordMovement(data: StockMovementDTO & { companyId: string }) {
    return (prisma as any).stockMovement.create({
      data
    });
  }

  async findAllMovements(companyId: string) {
    return (prisma as any).stockMovement.findMany({
      where: { companyId },
      include: {
        inventoryItem: true,
        warehouse: true,
        project: true
      },
      orderBy: { createdAt: 'desc' }
    });
  }
}

