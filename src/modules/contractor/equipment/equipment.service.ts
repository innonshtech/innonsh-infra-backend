import { EquipmentRepository } from './equipment.repository';
import { prisma } from '@config/prisma.config';

export class EquipmentService {
  private repo: EquipmentRepository;

  constructor() {
    this.repo = new EquipmentRepository();
  }

  async getAllEquipment(companyId: string, filters?: any) {
    return this.repo.findAll(companyId, filters);
  }

  async getEquipmentById(id: string, companyId: string) {
    return this.repo.findById(id, companyId);
  }

  async createEquipment(companyId: string, data: any) {
    const equipment = await this.repo.create({ ...data, companyId });

    // If OWNED and has purchase cost, create a one-time EXPENSE transaction
    if (data.ownership === 'OWNED' && data.purchaseCost && data.purchaseCost > 0) {
      await (prisma as any).transaction.create({
        data: {
          companyId,
          type: 'EXPENSE',
          category: 'EQUIPMENT_PURCHASE',
          amount: data.purchaseCost,
          description: `Equipment Purchase - ${data.name} (${data.type})`,
          date: data.purchaseDate ? new Date(data.purchaseDate) : new Date(),
          referenceId: equipment.id
        }
      });
    }

    return equipment;
  }

  async updateEquipment(id: string, companyId: string, data: any) {
    return this.repo.update(id, companyId, data);
  }

  async deleteEquipment(id: string, companyId: string) {
    return this.repo.delete(id, companyId);
  }

  async getEquipmentStats(companyId: string) {
    return this.repo.getStats(companyId);
  }

  async addMaintenanceLog(companyId: string, data: any) {
    const log = await this.repo.createMaintenanceLog({ ...data, companyId });

    // Auto-create EXPENSE transaction for maintenance cost
    if (data.cost && data.cost > 0) {
      const equipment = await this.repo.findById(data.equipmentId, companyId);
      await (prisma as any).transaction.create({
        data: {
          companyId,
          type: 'EXPENSE',
          category: 'EQUIPMENT_MAINTENANCE',
          amount: data.cost,
          description: `Equipment Maintenance - ${equipment?.name || 'Unknown'} (${data.type || 'REPAIR'})`,
          date: new Date(),
          referenceId: log.id
        }
      });
    }

    return log;
  }

  async getMaintenanceHistory(id: string, companyId: string) {
    return this.repo.getMaintenanceHistory(id, companyId);
  }

  // ─── Equipment Deployment ───

  async deployEquipment(companyId: string, data: { equipmentId: string; projectId: string; startDate: string; dailyRate?: number; hoursPerDay?: number; notes?: string }) {
    const equipment = await this.repo.findById(data.equipmentId, companyId);
    if (!equipment) throw new Error('Equipment not found');

    // End any active deployment for this equipment
    const activeDeployments = await this.repo.getDeployments(companyId, { equipmentId: data.equipmentId, status: 'ACTIVE' });
    for (const dep of activeDeployments) {
      const days = Math.ceil((new Date().getTime() - new Date(dep.startDate).getTime()) / (1000 * 60 * 60 * 24));
      const totalCost = days * dep.dailyRate;
      await this.repo.endDeployment(dep.id, companyId, new Date(), totalCost);

      // Create EXPENSE for the completed deployment
      if (totalCost > 0) {
        await (prisma as any).transaction.create({
          data: {
            companyId,
            type: 'EXPENSE',
            category: 'EQUIPMENT_RENTAL',
            amount: totalCost,
            description: `Equipment Rental - ${equipment.name} at ${dep.project?.name || 'Unknown'} (${days} days)`,
            date: new Date(),
            referenceId: dep.id
          }
        });
      }
    }

    // Update equipment's current project
    await this.repo.update(data.equipmentId, companyId, { projectId: data.projectId });

    // Create new deployment
    return this.repo.createDeployment({
      companyId,
      equipmentId: data.equipmentId,
      projectId: data.projectId,
      startDate: new Date(data.startDate),
      dailyRate: data.dailyRate || equipment.dailyRentalRate || 0,
      hoursPerDay: data.hoursPerDay || 8,
      notes: data.notes
    });
  }

  async endDeployment(id: string, companyId: string) {
    const deployments = await this.repo.getDeployments(companyId, { status: 'ACTIVE' });
    const dep = deployments.find((d: any) => d.id === id);
    if (!dep) throw new Error('Active deployment not found');

    const days = Math.ceil((new Date().getTime() - new Date(dep.startDate).getTime()) / (1000 * 60 * 60 * 24));
    const totalCost = days * dep.dailyRate;

    await this.repo.endDeployment(id, companyId, new Date(), totalCost);

    // Auto-create EXPENSE transaction
    if (totalCost > 0) {
      await (prisma as any).transaction.create({
        data: {
          companyId,
          type: 'EXPENSE',
          category: 'EQUIPMENT_RENTAL',
          amount: totalCost,
          description: `Equipment Rental - ${dep.equipment?.name || 'Unknown'} at ${dep.project?.name || 'Unknown'} (${days} days)`,
          date: new Date(),
          referenceId: dep.id
        }
      });
    }

    return { days, totalCost };
  }

  async getDeployments(companyId: string, filters?: any) {
    return this.repo.getDeployments(companyId, filters);
  }

  // ─── Fuel Logs ───

  async addFuelLog(companyId: string, data: any) {
    const totalCost = (data.quantity || 0) * (data.costPerUnit || 0);
    const log = await this.repo.createFuelLog({
      ...data,
      companyId,
      totalCost,
      date: data.date ? new Date(data.date) : new Date()
    });

    // Auto-create EXPENSE transaction
    if (totalCost > 0) {
      const equipment = await this.repo.findById(data.equipmentId, companyId);
      await (prisma as any).transaction.create({
        data: {
          companyId,
          type: 'EXPENSE',
          category: 'EQUIPMENT_FUEL',
          amount: totalCost,
          description: `Fuel - ${equipment?.name || 'Unknown'} (${data.quantity}L ${data.fuelType || 'DIESEL'})`,
          date: new Date(),
          referenceId: log.id
        }
      });
    }

    return log;
  }

  async getFuelLogs(companyId: string, filters?: any) {
    return this.repo.getFuelLogs(companyId, filters);
  }
}
