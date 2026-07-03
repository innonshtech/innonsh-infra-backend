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
    // Sanitize empty strings and parse values to correct types
    if (data.serialNumber === '') data.serialNumber = null;
    if (data.projectId === '') data.projectId = null;

    if (data.purchaseDate && typeof data.purchaseDate === 'string' && data.purchaseDate.trim() !== '') {
      data.purchaseDate = new Date(data.purchaseDate);
    } else {
      data.purchaseDate = null;
    }

    if (data.purchaseCost === '' || data.purchaseCost === null || data.purchaseCost === undefined) {
      data.purchaseCost = null;
    } else if (typeof data.purchaseCost === 'string') {
      data.purchaseCost = parseFloat(data.purchaseCost) || null;
    }

    if (data.assetLifeYears === '' || data.assetLifeYears === null || data.assetLifeYears === undefined) {
      data.assetLifeYears = null;
    } else if (typeof data.assetLifeYears === 'string') {
      data.assetLifeYears = parseInt(data.assetLifeYears) || null;
    }

    if (data.dailyRentalRate === '' || data.dailyRentalRate === null || data.dailyRentalRate === undefined) {
      data.dailyRentalRate = null;
    } else if (typeof data.dailyRentalRate === 'string') {
      data.dailyRentalRate = parseFloat(data.dailyRentalRate) || null;
    }

    if (data.hourlyRate === '' || data.hourlyRate === null || data.hourlyRate === undefined) {
      data.hourlyRate = null;
    } else if (typeof data.hourlyRate === 'string') {
      data.hourlyRate = parseFloat(data.hourlyRate) || null;
    }

    const equipment = await this.repo.create({ ...data, companyId });

    // If projectId is provided during registration, also create an initial deployment log
    if (data.projectId) {
      await this.repo.createDeployment({
        companyId,
        equipmentId: equipment.id,
        projectId: data.projectId,
        startDate: data.purchaseDate || new Date(),
        dailyRate: data.dailyRentalRate || 0,
        hoursPerDay: 8,
        notes: 'Initial deployment during registration'
      });
    }

    // If OWNED and has purchase cost, create a one-time EXPENSE transaction
    if (data.ownership === 'OWNED' && data.purchaseCost && data.purchaseCost > 0) {
      await (prisma as any).transaction.create({
        data: {
          companyId,
          type: 'EXPENSE',
          category: 'EQUIPMENT_PURCHASE',
          amount: data.purchaseCost,
          description: `Equipment Purchase - ${data.name} (${data.type})`,
          date: data.purchaseDate ? data.purchaseDate : new Date(),
          referenceId: equipment.id
        }
      });
    }

    return equipment;
  }

  async updateEquipment(id: string, companyId: string, data: any) {
    // Sanitize empty strings and parse values to correct types
    if (data.serialNumber === '') data.serialNumber = null;
    if (data.projectId === '') data.projectId = null;

    if (data.purchaseDate && typeof data.purchaseDate === 'string' && data.purchaseDate.trim() !== '') {
      data.purchaseDate = new Date(data.purchaseDate);
    } else if (data.purchaseDate === '') {
      data.purchaseDate = null;
    }

    if (data.purchaseCost === '') {
      data.purchaseCost = null;
    } else if (typeof data.purchaseCost === 'string') {
      data.purchaseCost = parseFloat(data.purchaseCost) || null;
    }

    if (data.assetLifeYears === '') {
      data.assetLifeYears = null;
    } else if (typeof data.assetLifeYears === 'string') {
      data.assetLifeYears = parseInt(data.assetLifeYears) || null;
    }

    if (data.dailyRentalRate === '') {
      data.dailyRentalRate = null;
    } else if (typeof data.dailyRentalRate === 'string') {
      data.dailyRentalRate = parseFloat(data.dailyRentalRate) || null;
    }

    if (data.hourlyRate === '') {
      data.hourlyRate = null;
    } else if (typeof data.hourlyRate === 'string') {
      data.hourlyRate = parseFloat(data.hourlyRate) || null;
    }

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

    // Update equipment's current project and status
    await this.repo.update(data.equipmentId, companyId, { projectId: data.projectId, status: 'OPERATIONAL' });

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

    // Release equipment back to yard as IDLE
    await this.repo.update(dep.equipmentId, companyId, { projectId: null, status: 'IDLE' });

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

  async updateDeployment(id: string, companyId: string, data: any) {
    if (data.startDate) data.startDate = new Date(data.startDate);
    if (data.endDate) data.endDate = new Date(data.endDate);
    if (data.dailyRate !== undefined && data.dailyRate !== '') data.dailyRate = parseFloat(data.dailyRate) || 0;
    if (data.hoursPerDay !== undefined && data.hoursPerDay !== '') data.hoursPerDay = parseInt(data.hoursPerDay) || 8;

    if (data.status === 'COMPLETED' && data.startDate && data.endDate) {
      const days = Math.ceil((new Date(data.endDate).getTime() - new Date(data.startDate).getTime()) / (1000 * 60 * 60 * 24)) || 1;
      const rate = data.dailyRate !== undefined ? data.dailyRate : 0;
      data.totalCost = days * rate;
    }

    return this.repo.updateDeployment(id, companyId, data);
  }

  async deleteDeployment(id: string, companyId: string) {
    const deployments = await this.repo.getDeployments(companyId);
    const dep = deployments.find((d: any) => d.id === id);
    if (dep) {
      const equipment = await this.repo.findById(dep.equipmentId, companyId);
      if (equipment && equipment.projectId === dep.projectId) {
        await this.repo.update(dep.equipmentId, companyId, { projectId: null, status: 'IDLE' });
      }
    }
    return this.repo.deleteDeployment(id, companyId);
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

  async updateFuelLog(id: string, companyId: string, data: any) {
    const totalCost = (data.quantity || 0) * (data.costPerUnit || 0);
    const updateData: any = {
      fuelType: data.fuelType,
      quantity: data.quantity !== undefined ? parseFloat(data.quantity) : undefined,
      costPerUnit: data.costPerUnit !== undefined ? parseFloat(data.costPerUnit) : undefined,
      totalCost,
      operatorName: data.operatorName,
      projectId: data.projectId || null,
      notes: data.notes
    };
    if (data.date) updateData.date = new Date(data.date);

    await this.repo.updateFuelLog(id, companyId, updateData);

    // Also update the linked expense transaction if totalCost > 0
    if (totalCost > 0) {
      const equipment = await this.repo.findById(data.equipmentId || '', companyId);
      await (prisma as any).transaction.updateMany({
        where: { referenceId: id, companyId },
        data: {
          amount: totalCost,
          description: `Fuel - ${equipment?.name || 'Unknown'} (${data.quantity}L ${data.fuelType || 'DIESEL'})`,
          date: updateData.date ? updateData.date : new Date()
        }
      });
    } else {
      await (prisma as any).transaction.deleteMany({
        where: { referenceId: id, companyId }
      });
    }

    return true;
  }

  async deleteFuelLog(id: string, companyId: string) {
    await (prisma as any).transaction.deleteMany({
      where: { referenceId: id, companyId }
    });
    return this.repo.deleteFuelLog(id, companyId);
  }
}
