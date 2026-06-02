import { ProcurementRepository } from './procurement.repository';
import { CreateProcurementRequestDTO, CreatePurchaseOrderDTO, UpdateProcurementRequestDTO, UpdatePurchaseOrderDTO } from './procurement.dto';
import { prisma } from '@config/prisma.config';

export class ProcurementService {
  private repository: ProcurementRepository;

  constructor() {
    this.repository = new ProcurementRepository();
  }

  // --- Procurement Request logic ---

  async getAllRequests(companyId: string) {
    return this.repository.findAllRequests(companyId);
  }

  async getRequestById(id: string, companyId: string) {
    const request = await this.repository.findRequestById(id, companyId);
    if (!request) throw new Error('Procurement request not found');
    return request;
  }

  async createRequest(companyId: string, requestedById: string, data: CreateProcurementRequestDTO) {
    return this.repository.createRequest({ ...data, companyId, requestedById });
  }

  async updateRequest(id: string, companyId: string, data: UpdateProcurementRequestDTO) {
    const request = await this.getRequestById(id, companyId);
    if (request.status !== 'PENDING') {
      throw new Error('Only pending requests can be updated');
    }
    return this.repository.updateRequest(id, companyId, data);
  }

  async deleteRequest(id: string, companyId: string) {
    const request = await this.getRequestById(id, companyId);
    if (request.status === 'APPROVED') {
      throw new Error('Cannot delete an approved request');
    }
    return this.repository.deleteRequest(id, companyId);
  }

  async approveRequest(id: string, companyId: string, approvedById: string) {
    const request = await this.getRequestById(id, companyId);
    if (request.status !== 'PENDING') {
      throw new Error('Request is already ' + request.status.toLowerCase());
    }
    return this.repository.approveRequest(id, companyId, approvedById);
  }

  async rejectRequest(id: string, companyId: string) {
    const request = await this.getRequestById(id, companyId);
    if (request.status !== 'PENDING') {
      throw new Error('Request is already ' + request.status.toLowerCase());
    }
    return this.repository.rejectRequest(id, companyId);
  }

  // --- Purchase Order logic ---

  async getAllPurchaseOrders(companyId: string) {
    return this.repository.findAllPurchaseOrders(companyId);
  }

  async createPurchaseOrder(companyId: string, data: CreatePurchaseOrderDTO) {
    // Generate simple PO number: PO-YYYYMMDD-XXXX
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const latestPO = await this.repository.getLatestPONumber(companyId);
    let sequence = '0001';
    
    if (latestPO && latestPO.poNumber.includes(dateStr)) {
      const lastSeq = parseInt(latestPO.poNumber.split('-').pop() || '0');
      sequence = (lastSeq + 1).toString().padStart(4, '0');
    }

    const poNumber = `PO-${dateStr}-${sequence}`;
    
    return this.repository.createPurchaseOrder({ ...data, companyId, poNumber });
  }

  async updatePurchaseOrder(id: string, companyId: string, data: UpdatePurchaseOrderDTO) {
    return this.repository.updatePurchaseOrder(id, companyId, data);
  }

  async deletePurchaseOrder(id: string, companyId: string) {
    return this.repository.deletePurchaseOrder(id, companyId);
  }

  async receivePurchaseOrder(id: string, companyId: string, warehouseId: string) {
    const po = await (prisma as any).purchaseOrder.findFirst({
      where: { id, companyId },
      include: { items: true },
    });

    if (!po) throw new Error('Purchase order not found');
    if (po.status === 'RECEIVED') throw new Error('Purchase order has already been received');

    return (prisma as any).$transaction(async (tx: any) => {
      await tx.purchaseOrder.update({
        where: { id },
        data: {
          status: 'RECEIVED',
          receivedDate: new Date()
        }
      });

      for (const item of po.items) {
        let invItem = await tx.inventoryItem.findFirst({
          where: { companyId, name: item.description }
        });

        if (!invItem) {
          invItem = await tx.inventoryItem.create({
            data: {
              companyId,
              name: item.description,
              unit: item.unit,
              category: 'Purchased'
            }
          });
        }

        await tx.stock.upsert({
          where: {
            warehouseId_inventoryItemId: {
              warehouseId,
              inventoryItemId: invItem.id
            }
          },
          update: {
            quantity: { increment: item.quantity }
          },
          create: {
            companyId,
            warehouseId,
            inventoryItemId: invItem.id,
            quantity: item.quantity
          }
        });

        await tx.stockMovement.create({
          data: {
            companyId,
            warehouseId,
            inventoryItemId: invItem.id,
            quantity: item.quantity,
            type: 'IN',
            reference: po.poNumber,
            notes: `Received from Purchase Order ${po.poNumber}`,
            purchaseOrderId: po.id
          }
        });
      }

      await tx.transaction.create({
        data: {
          companyId,
          type: 'EXPENSE',
          category: 'MATERIAL_PURCHASE',
          amount: po.totalAmount,
          description: `Material Purchase - PO: ${po.poNumber}`,
          date: new Date(),
          referenceId: po.id
        }
      });

      return { success: true };
    });
  }

  // --- Vendor logic ---

  async getAllVendors(companyId: string) {
    return this.repository.findAllVendors(companyId);
  }

  async createVendor(companyId: string, data: { name: string; email?: string; phone?: string; address?: string }) {
    if (!data.name) throw new Error('Vendor name is required');
    return this.repository.createVendor({ ...data, companyId });
  }

  async deleteVendor(id: string, companyId: string) {
    return this.repository.deleteVendor(id, companyId);
  }
}
