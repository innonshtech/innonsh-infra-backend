import { prisma } from '@config/prisma.config';
import { CreateUnitDTO, UpdateUnitDTO, UpdateUnitStatusDTO, UpdateUnitPriceDTO } from './units.dto';

export class UnitsRepository {
  async findAll(companyId: string) {
    return (prisma as any).unit.findMany({
      where: { companyId },
      include: {
        project: { select: { name: true } }
      },
      orderBy: { unitNumber: 'asc' }
    });
  }

  async findById(id: string, companyId: string) {
    return (prisma as any).unit.findFirst({
      where: { id, companyId },
      include: {
        project: true
      }
    });
  }

  async create(data: CreateUnitDTO & { companyId: string }) {
    return (prisma as any).unit.create({
      data
    });
  }

  async update(id: string, companyId: string, data: UpdateUnitDTO) {
    return (prisma as any).unit.updateMany({
      where: { id, companyId },
      data
    });
  }

  async delete(id: string, companyId: string) {
    return (prisma as any).unit.deleteMany({
      where: { id, companyId }
    });
  }

  async updateStatus(id: string, data: UpdateUnitStatusDTO & { fromStatus: string, changedById: string }) {
    const { status, fromStatus, changedById, notes } = data;

    return (prisma as any).$transaction([
      (prisma as any).unit.update({
        where: { id },
        data: { status }
      }),
      (prisma as any).unitHistory.create({
        data: {
          unitId: id,
          fromStatus,
          toStatus: status,
          changedById,
          notes
        }
      })
    ]);
  }

  async updatePrice(id: string, data: UpdateUnitPriceDTO & { oldPrice: number, changedById: string }) {
    const { price, oldPrice, changedById } = data;

    return (prisma as any).$transaction([
      (prisma as any).unit.update({
        where: { id },
        data: { price }
      }),
      (prisma as any).unitPriceLog.create({
        data: {
          unitId: id,
          oldPrice,
          newPrice: price,
          changedById
        }
      })
    ]);
  }

  async getHistory(unitId: string) {
    return (prisma as any).unitHistory.findMany({
      where: { unitId },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getPricingLogs(unitId: string) {
    return (prisma as any).unitPriceLog.findMany({
      where: { unitId },
      orderBy: { createdAt: 'desc' }
    });
  }
}
