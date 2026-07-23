import { prisma } from '../../../config/prisma.config';
import { CreateProcurementRequestDTO, CreatePurchaseOrderDTO, UpdateProcurementRequestDTO, UpdatePurchaseOrderDTO } from './procurement.dto';

export class ProcurementRepository {
  // --- Procurement Request Repos ---

  async findAllRequests(companyId: string) {
    return (prisma as any).procurementRequest.findMany({
      where: { companyId },
      include: {
        project: { select: { name: true } },
        requestedBy: { select: { firstName: true, lastName: true } },
        items: true,
        _count: { select: { purchaseOrders: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async findRequestById(id: string, companyId: string) {
    return (prisma as any).procurementRequest.findFirst({
      where: { id, companyId },
      include: {
        project: true,
        items: true,
        purchaseOrders: true,
        requestedBy: { select: { firstName: true, lastName: true } },
        approvedBy: { select: { firstName: true, lastName: true } }
      }
    });
  }

  async createRequest(data: CreateProcurementRequestDTO & { companyId: string, requestedById: string }) {
    return (prisma as any).procurementRequest.create({
      data: {
        companyId: data.companyId,
        projectId: data.projectId,
        title: data.title,
        description: data.description,
        requestedById: data.requestedById,
        items: {
          create: data.items
        }
      },
      include: { items: true }
    });
  }

  async updateRequest(id: string, companyId: string, data: UpdateProcurementRequestDTO) {
    return (prisma as any).procurementRequest.updateMany({
      where: { id, companyId },
      data
    });
  }

  async deleteRequest(id: string, companyId: string) {
    return (prisma as any).procurementRequest.deleteMany({
      where: { id, companyId }
    });
  }

  async approveRequest(id: string, companyId: string, approvedById: string) {
    return (prisma as any).procurementRequest.updateMany({
      where: { id, companyId },
      data: {
        status: 'APPROVED',
        approvedById,
        approvalDate: new Date()
      }
    });
  }

  async rejectRequest(id: string, companyId: string) {
    return (prisma as any).procurementRequest.updateMany({
      where: { id, companyId },
      data: {
        status: 'REJECTED'
      }
    });
  }

  // --- Purchase Order Repos ---

  async findAllPurchaseOrders(companyId: string) {
    return (prisma as any).purchaseOrder.findMany({
      where: { companyId },
      include: {
        vendor: { select: { name: true } },
        request: { select: { title: true } },
        _count: { select: { items: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async createPurchaseOrder(data: CreatePurchaseOrderDTO & { companyId: string, poNumber: string }) {
    const totalAmount = data.items.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
    return (prisma as any).$transaction(async (tx: any) => {
      const po = await tx.purchaseOrder.create({
        data: {
          companyId: data.companyId,
          vendorId: data.vendorId,
          requestId: data.requestId,
          poNumber: data.poNumber,
          totalAmount,
          items: {
            create: data.items.map((item: any) => ({
              ...item,
              amount: item.quantity * item.rate
            }))
          }
        },
        include: { items: true, vendor: true }
      });

      if (data.requestId) {
        await tx.procurementRequest.updateMany({
          where: { id: data.requestId, companyId: data.companyId },
          data: { status: 'ORDERED' }
        });
      }

      return po;
    });
  }

  async updatePurchaseOrder(id: string, companyId: string, data: UpdatePurchaseOrderDTO) {
    return (prisma as any).purchaseOrder.updateMany({
      where: { id, companyId },
      data
    });
  }

  async deletePurchaseOrder(id: string, companyId: string) {
    return (prisma as any).purchaseOrder.deleteMany({
      where: { id, companyId }
    });
  }

  // Helper for unique PO numbers
  async getLatestPONumber(companyId: string) {
    return (prisma as any).purchaseOrder.findFirst({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
      select: { poNumber: true }
    });
  }

  // --- Vendor Repos ---

  async findAllVendors(companyId: string) {
    return (prisma as any).vendor.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' }
    });
  }

  async createVendor(data: { companyId: string; name: string; email?: string; phone?: string; address?: string; serviceType?: string }) {
    return (prisma as any).vendor.create({
      data
    });
  }

  async updateVendor(id: string, companyId: string, data: { name: string; email?: string; phone?: string; address?: string; serviceType?: string }) {
    return (prisma as any).vendor.update({
      where: { id },
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        address: data.address,
        serviceType: data.serviceType
      }
    });
  }

  async deleteVendor(id: string, companyId: string) {
    return (prisma as any).vendor.deleteMany({
      where: { id, companyId }
    });
  }
}
