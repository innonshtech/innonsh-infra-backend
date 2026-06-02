import { LeaseRepository } from './lease.repository';
import { CreateTenantDTO, UpdateTenantDTO, CreateAgreementDTO, UpdateAgreementDTO, CollectRentDTO } from './lease.dto';

export class LeaseService {
  private repository: LeaseRepository;

  constructor() {
    this.repository = new LeaseRepository();
  }

  // --- Tenant Logic ---

  async getAllTenants(companyId: string) {
    return this.repository.findAllTenants(companyId);
  }

  async getTenantById(id: string, companyId: string) {
    const tenant = await this.repository.findTenantById(id, companyId);
    if (!tenant) throw new Error('Tenant not found');
    return tenant;
  }

  async createTenant(companyId: string, data: CreateTenantDTO) {
    return this.repository.createTenant({ ...data, companyId });
  }

  async updateTenant(id: string, companyId: string, data: UpdateTenantDTO) {
    return this.repository.updateTenant(id, companyId, data);
  }

  async deleteTenant(id: string, companyId: string) {
    return this.repository.deleteTenant(id, companyId);
  }

  // --- Agreement Logic ---

  async getAllAgreements(companyId: string) {
    return this.repository.findAllAgreements(companyId);
  }

  async getAgreementById(id: string, companyId: string) {
    const agreement = await this.repository.findAgreementById(id, companyId);
    if (!agreement) throw new Error('Agreement not found');
    return agreement;
  }

  async createAgreement(companyId: string, data: CreateAgreementDTO) {
    return this.repository.createAgreement({ ...data, companyId });
  }

  async updateAgreement(id: string, companyId: string, data: UpdateAgreementDTO) {
    return this.repository.updateAgreement(id, companyId, data);
  }

  // --- Rent Collection Logic ---

  async getAllCollections(companyId: string) {
    return this.repository.findAllCollections(companyId);
  }

  async recordCollection(companyId: string, data: CollectRentDTO) {
    // Business rule: Multiple rent records for same month/year/agreement should be noted or restricted
    return this.repository.recordCollection({ ...data, companyId });
  }
}
