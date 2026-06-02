import { UnitsRepository } from './units.repository';
import { CreateUnitDTO, UpdateUnitDTO, UpdateUnitStatusDTO, UpdateUnitPriceDTO } from './units.dto';

export class UnitsService {
  private repository: UnitsRepository;

  constructor() {
    this.repository = new UnitsRepository();
  }

  async getAllUnits(companyId: string) {
    return this.repository.findAll(companyId);
  }

  async getUnitById(id: string, companyId: string) {
    const unit = await this.repository.findById(id, companyId);
    if (!unit) throw new Error('Unit not found');
    return unit;
  }

  async createUnit(companyId: string, data: CreateUnitDTO) {
    return this.repository.create({ ...data, companyId });
  }

  async updateUnit(id: string, companyId: string, data: UpdateUnitDTO) {
    return this.repository.update(id, companyId, data);
  }

  async deleteUnit(id: string, companyId: string) {
    return this.repository.delete(id, companyId);
  }

  async updateUnitStatus(id: string, companyId: string, changedById: string, data: UpdateUnitStatusDTO) {
    const unit = await this.getUnitById(id, companyId);
    return this.repository.updateStatus(id, {
      ...data,
      fromStatus: unit.status,
      changedById
    });
  }

  async updateUnitPrice(id: string, companyId: string, changedById: string, data: UpdateUnitPriceDTO) {
    const unit = await this.getUnitById(id, companyId);
    return this.repository.updatePrice(id, {
      ...data,
      oldPrice: unit.price,
      changedById
    });
  }

  async getUnitHistory(id: string, companyId: string) {
    await this.getUnitById(id, companyId);
    return this.repository.getHistory(id);
  }

  async getUnitPricing(id: string, companyId: string) {
    await this.getUnitById(id, companyId);
    return this.repository.getPricingLogs(id);
  }
}
