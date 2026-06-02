import { prisma } from '../../../config/prisma.config';
import { CreateEstimationDTO, AddEstimationItemDTO, UpdateEstimationItemDTO } from './estimation.dto';

export class EstimationRepository {
  async findAll(companyId: string) {
    return prisma.estimation.findMany({
      where: { companyId },
      include: {
        project: {
          select: { name: true },
        },
        versions: {
          orderBy: { versionNumber: 'desc' },
          take: 1,
          include: {
            requestedBy: { select: { firstName: true, lastName: true, email: true } },
            designatedApprover: { select: { firstName: true, lastName: true, email: true } },
            approvedBy: { select: { firstName: true, lastName: true, email: true } },
          }
        },
      },
    });
  }

  async findById(id: string, companyId: string) {
    return prisma.estimation.findFirst({
      where: { id, companyId },
      include: {
        project: true,
        versions: {
          include: {
            items: true,
            requestedBy: { select: { firstName: true, lastName: true, email: true } },
            designatedApprover: { select: { firstName: true, lastName: true, email: true } },
            approvedBy: { select: { firstName: true, lastName: true, email: true } },
          },
          orderBy: { versionNumber: 'desc' },
        },
      },
    });
  }

  async create(data: CreateEstimationDTO & { companyId: string }) {
    return prisma.estimation.create({
      data: {
        projectId: data.projectId,
        companyId: data.companyId,
        versions: {
          create: {
            versionNumber: 1,
            title: data.title,
            description: data.description,
            status: 'DRAFT',
          },
        },
      },
      include: {
        versions: true,
      },
    });
  }

  async delete(id: string, companyId: string) {
    const estimation = await prisma.estimation.findFirst({ where: { id, companyId } });
    if (!estimation) throw new Error('Estimation not found or unauthorized');

    return prisma.$transaction(async (tx: any) => {
      // 1. Get all version IDs for this estimation
      const versions = await tx.estimationVersion.findMany({ where: { estimationId: id } });
      const versionIds = versions.map((v: any) => v.id);

      // 2. Delete all items belonging to these versions
      if (versionIds.length > 0) {
        await tx.estimationItem.deleteMany({
          where: { estimationVersionId: { in: versionIds } }
        });
      }

      // 3. Delete the versions
      await tx.estimationVersion.deleteMany({
        where: { estimationId: id }
      });

      // 4. Delete the parent estimation
      return tx.estimation.deleteMany({
        where: { id, companyId }
      });
    });
  }

  async update(id: string, companyId: string, data: { title: string; description?: string }) {
    const estimation = await prisma.estimation.findFirst({
      where: { id, companyId },
      include: { versions: { orderBy: { versionNumber: 'desc' }, take: 1 } }
    });
    if (!estimation) throw new Error('Estimation not found');
    const latestVersion = estimation.versions[0];
    if (!latestVersion) throw new Error('No version found to update');

    return prisma.estimationVersion.update({
      where: { id: latestVersion.id },
      data: {
        title: data.title,
        description: data.description || null
      }
    });
  }

  async addItem(versionId: string, data: AddEstimationItemDTO) {
    const amount = data.quantity * data.rate;
    return prisma.estimationItem.create({
      data: {
        estimationVersionId: versionId,
        ...data,
        amount,
      },
    });
  }

  async updateItem(itemId: string, data: UpdateEstimationItemDTO) {
    // If quantity or rate is updated, recalculate amount
    const existing = await prisma.estimationItem.findUnique({ where: { id: itemId } });
    if (!existing) throw new Error('Item not found');

    const quantity = data.quantity ?? existing.quantity;
    const rate = data.rate ?? existing.rate;
    const amount = quantity * rate;

    return prisma.estimationItem.update({
      where: { id: itemId },
      data: {
        ...data,
        amount,
      },
    });
  }

  async removeItem(itemId: string) {
    return prisma.estimationItem.delete({
      where: { id: itemId },
    });
  }

  async approve(estimationId: string, companyId: string) {
    return prisma.estimation.updateMany({
      where: { id: estimationId, companyId },
      data: { status: 'APPROVED' },
    });
  }

  async updateVersionStatus(versionId: string, status: string, extraData: any = {}) {
    return prisma.estimationVersion.update({
      where: { id: versionId },
      data: { status, ...extraData },
    });
  }

  async createNewVersion(estimationId: string, previousVersionId: string, versionNumber: number) {
    const prevVersion = await prisma.estimationVersion.findUnique({
      where: { id: previousVersionId },
      include: { items: true },
    });

    if (!prevVersion) throw new Error('Previous version not found');

    return prisma.estimationVersion.create({
      data: {
        estimationId,
        versionNumber,
        title: prevVersion.title,
        description: prevVersion.description,
        totalAmount: prevVersion.totalAmount,
        status: 'DRAFT',
        items: {
          create: prevVersion.items.map((item: any) => ({
            description: item.description,
            quantity: item.quantity,
            unit: item.unit,
            rate: item.rate,
            amount: item.amount,
          })),
        },
      },
    });
  }

  async getVersions(estimationId: string) {
    return prisma.estimationVersion.findMany({
      where: { estimationId },
      include: {
        _count: { select: { items: true } },
      },
      orderBy: { versionNumber: 'desc' },
    });
  }

  async recalculateTotal(versionId: string) {
    const items = await prisma.estimationItem.findMany({
      where: { estimationVersionId: versionId },
    });
    const total = items.reduce((sum: number, item: any) => sum + item.amount, 0);
    
    return prisma.estimationVersion.update({
      where: { id: versionId },
      data: { totalAmount: total },
    });
  }

  // Simple pass-through: respects whatever quantities the user confirmed
  async createProcurementFromVersion(version: any, companyId: string, userId: string, projectId: string) {
    return (prisma as any).procurementRequest.create({
      data: {
        companyId,
        projectId,
        title: `Procurement for ${version.title} (From BOQ)`,
        description: `Auto-generated procurement request from estimation version ${version.versionNumber}`,
        status: 'PENDING',
        requestedById: userId,
        estimationVersionId: version.id,
        items: {
          create: version.items.map((item: any) => ({
            description: item.description,
            quantity: item.quantity,
            unit: item.unit,
            estimatedRate: item.rate,
            amount: item.amount,
          })),
        },
      },
      include: { items: true },
    });
  }

  // Inventory cross-check: uses inventoryItemId (UUID) for accurate matching, falls back to name
  async checkInventoryForVersion(version: any, companyId: string) {
    const results = [];

    for (const item of version.items) {
      let invItem = null;

      // Priority 1: Match by exact inventoryItemId (catalog-linked)
      if (item.inventoryItemId) {
        invItem = await (prisma as any).inventoryItem.findFirst({
          where: { id: item.inventoryItemId, companyId }
        });
      }

      // Fallback: Match by name (for legacy items without catalog link)
      if (!invItem) {
        invItem = await (prisma as any).inventoryItem.findFirst({
          where: { companyId, name: item.description }
        });
      }

      let currentStock = 0;
      if (invItem) {
        const stocks = await (prisma as any).stock.findMany({
          where: { companyId, inventoryItemId: invItem.id }
        });
        currentStock = stocks.reduce((sum: number, s: any) => sum + s.quantity, 0);
      }

      results.push({
        description: item.description,
        inventoryItemId: item.inventoryItemId || invItem?.id || null,
        catalogLinked: !!item.inventoryItemId || !!invItem,
        boqQuantity: item.quantity,
        unit: item.unit,
        rate: item.rate,
        currentStock,
        deficit: Math.max(0, item.quantity - currentStock),
      });
    }

    return results;
  }
}
