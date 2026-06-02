import { prisma } from '../../../config/prisma.config';

export class EquipmentRepository {
  async findAll(companyId: string, filters?: { projectId?: string; status?: string; type?: string }) {
    const where: any = { companyId };
    if (filters?.projectId) where.projectId = filters.projectId;
    if (filters?.status) where.status = filters.status;
    if (filters?.type) where.type = filters.type;

    return (prisma as any).equipment.findMany({
      where,
      include: { project: { select: { name: true } } },
      orderBy: { name: 'asc' }
    });
  }

  async findById(id: string, companyId: string) {
    return (prisma as any).equipment.findFirst({
      where: { id, companyId },
      include: { 
        project: { select: { name: true } }, 
        maintenanceLogs: { orderBy: { date: 'desc' }, take: 10 },
        deployments: { orderBy: { startDate: 'desc' }, include: { project: { select: { name: true } } } },
        fuelLogs: { orderBy: { date: 'desc' }, take: 20 }
      }
    });
  }

  async create(data: any) {
    return (prisma as any).equipment.create({ data });
  }

  async update(id: string, companyId: string, data: any) {
    return (prisma as any).equipment.updateMany({ where: { id, companyId }, data });
  }

  async delete(id: string, companyId: string) {
    return (prisma as any).equipment.deleteMany({ where: { id, companyId } });
  }

  async getStats(companyId: string) {
    const total = await (prisma as any).equipment.count({ where: { companyId } });
    const operational = await (prisma as any).equipment.count({ where: { companyId, status: 'OPERATIONAL' } });
    const inMaintenance = await (prisma as any).equipment.count({ where: { companyId, status: 'MAINTENANCE' } });
    const rented = await (prisma as any).equipment.count({ where: { companyId, ownership: 'RENTED' } });
    return { total, operational, inMaintenance, idle: total - operational - inMaintenance, rented };
  }

  // ─── Maintenance Logs ───
  async createMaintenanceLog(data: any) {
    if (data.date) {
      await (prisma as any).equipment.update({
        where: { id: data.equipmentId },
        data: { 
          lastMaintenance: new Date(data.date),
          nextMaintenance: data.nextDueDate ? new Date(data.nextDueDate) : undefined
        }
      });
    }
    return (prisma as any).maintenanceLog.create({ data });
  }

  async getMaintenanceHistory(equipmentId: string, companyId: string) {
    return (prisma as any).maintenanceLog.findMany({
      where: { equipmentId, companyId },
      orderBy: { date: 'desc' }
    });
  }

  // ─── Equipment Deployment ───
  async createDeployment(data: any) {
    return (prisma as any).equipmentDeployment.create({ data });
  }

  async getDeployments(companyId: string, filters?: { equipmentId?: string; projectId?: string; status?: string }) {
    const where: any = { companyId };
    if (filters?.equipmentId) where.equipmentId = filters.equipmentId;
    if (filters?.projectId) where.projectId = filters.projectId;
    if (filters?.status) where.status = filters.status;

    return (prisma as any).equipmentDeployment.findMany({
      where,
      include: {
        equipment: { select: { name: true, type: true, ownership: true } },
        project: { select: { name: true } }
      },
      orderBy: { startDate: 'desc' }
    });
  }

  async endDeployment(id: string, companyId: string, endDate: Date, totalCost: number) {
    return (prisma as any).equipmentDeployment.updateMany({
      where: { id, companyId },
      data: { endDate, totalCost, status: 'COMPLETED' }
    });
  }

  // ─── Fuel Logs ───
  async createFuelLog(data: any) {
    return (prisma as any).fuelLog.create({ data });
  }

  async getFuelLogs(companyId: string, filters?: { equipmentId?: string; projectId?: string }) {
    const where: any = { companyId };
    if (filters?.equipmentId) where.equipmentId = filters.equipmentId;
    if (filters?.projectId) where.projectId = filters.projectId;

    return (prisma as any).fuelLog.findMany({
      where,
      include: {
        equipment: { select: { name: true, type: true } },
        project: { select: { name: true } }
      },
      orderBy: { date: 'desc' }
    });
  }
}
