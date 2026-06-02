import { EstimationRepository } from './estimation.repository';
import { CreateEstimationDTO, AddEstimationItemDTO, UpdateEstimationItemDTO } from './estimation.dto';

export class EstimationService {
  private estimationRepository: EstimationRepository;

  constructor() {
    this.estimationRepository = new EstimationRepository();
  }

  async getAllEstimations(companyId: string) {
    return this.estimationRepository.findAll(companyId);
  }

  async getEstimationById(id: string, companyId: string) {
    const estimation = await this.estimationRepository.findById(id, companyId);
    if (!estimation) {
      throw new Error('Estimation not found');
    }
    return estimation;
  }

  async createEstimation(companyId: string, data: CreateEstimationDTO) {
    return this.estimationRepository.create({ ...data, companyId });
  }

  async updateEstimation(id: string, companyId: string, data: { title: string; description?: string }) {
    await this.getEstimationById(id, companyId);
    return this.estimationRepository.update(id, companyId, data);
  }

  async deleteEstimation(id: string, companyId: string) {
    await this.getEstimationById(id, companyId);
    return this.estimationRepository.delete(id, companyId);
  }

  async addItem(estimationId: string, companyId: string, data: AddEstimationItemDTO) {
    const estimation = await this.getEstimationById(estimationId, companyId);
    const latestVersion = estimation.versions[0];
    
    if (latestVersion.status !== 'DRAFT' && latestVersion.status !== 'PENDING_APPROVAL') {
      throw new Error('Cannot add items to this estimation version. Please create a new version.');
    }

    const item = await this.estimationRepository.addItem(latestVersion.id, data);
    await this.estimationRepository.recalculateTotal(latestVersion.id);
    return item;
  }

  async updateItem(estimationId: string, itemId: string, companyId: string, data: UpdateEstimationItemDTO) {
    const estimation = await this.getEstimationById(estimationId, companyId);
    const latestVersion = estimation.versions[0];
    
    // Safety check: ensure the item belongs to the latest version of this estimation
    const item = latestVersion.items.find((i: any) => i.id === itemId);
    if (!item) throw new Error('Item not found in the current version of this estimation');

    if (latestVersion.status !== 'DRAFT' && latestVersion.status !== 'PENDING_APPROVAL') {
      throw new Error('Cannot update items in this estimation version.');
    }

    const updatedItem = await this.estimationRepository.updateItem(itemId, data);
    await this.estimationRepository.recalculateTotal(latestVersion.id);
    return updatedItem;
  }

  async deleteItem(estimationId: string, itemId: string, companyId: string) {
    const estimation = await this.getEstimationById(estimationId, companyId);
    const latestVersion = estimation.versions[0];
    
    const item = latestVersion.items.find((i: any) => i.id === itemId);
    if (!item) throw new Error('Item not found in the current version of this estimation');

    if (latestVersion.status !== 'DRAFT' && latestVersion.status !== 'PENDING_APPROVAL') {
      throw new Error('Cannot delete items from this estimation version.');
    }

    await this.estimationRepository.removeItem(itemId);
    await this.estimationRepository.recalculateTotal(latestVersion.id);
  }

  async requestApproval(id: string, companyId: string, requestedById: string, designatedApproverId: string, notes?: string) {
    const estimation = await this.getEstimationById(id, companyId);
    const latestVersion = estimation.versions[0];

    if (latestVersion.status !== 'DRAFT') {
      throw new Error('Only DRAFT estimations can be sent for approval');
    }

    return this.estimationRepository.updateVersionStatus(latestVersion.id, 'PENDING_APPROVAL', {
      requestedById,
      designatedApproverId,
      approvalNotes: notes
    });
  }

  async approveEstimation(id: string, companyId: string, userId: string, isSuperadmin: boolean) {
    const estimation = await this.getEstimationById(id, companyId);
    const latestVersion = estimation.versions[0];

    if (latestVersion.status === 'APPROVED') {
      throw new Error('Estimation is already approved');
    }

    // Check authorization: only designated approver or superadmin can approve
    if (latestVersion.designatedApproverId && latestVersion.designatedApproverId !== userId && !isSuperadmin) {
      throw new Error('You are not authorized to approve this estimation. Only the designated approver or a Superadmin can approve it.');
    }

    await this.estimationRepository.updateVersionStatus(latestVersion.id, 'APPROVED', {
      approvedById: userId,
      approvalDate: new Date()
    });
    return this.estimationRepository.approve(id, companyId);
  }

  async getVersions(estimationId: string, companyId: string) {
    await this.getEstimationById(estimationId, companyId);
    return this.estimationRepository.getVersions(estimationId);
  }

  async createNewVersion(id: string, companyId: string) {
    const estimation = await this.getEstimationById(id, companyId);
    const latestVersion = estimation.versions[0];

    const newVersion = await this.estimationRepository.createNewVersion(
      id,
      latestVersion.id,
      latestVersion.versionNumber + 1
    );

    // Update the main estimation's current version index
    // Note: In a real app, you might want to track this more formally.
    return newVersion;
  }

  async pushToProcurement(id: string, versionId: string, companyId: string, userId: string) {
    const estimation = await this.getEstimationById(id, companyId);
    const version = estimation.versions.find((v: any) => v.id === versionId);
    if (!version) throw new Error('Version not found');

    if (version.status !== 'APPROVED') {
      throw new Error('Only approved estimation versions can be pushed to procurement');
    }

    return this.estimationRepository.createProcurementFromVersion(version, companyId, userId, estimation.projectId);
  }

  async checkInventoryForVersion(id: string, versionId: string, companyId: string) {
    const estimation = await this.getEstimationById(id, companyId);
    const version = estimation.versions.find((v: any) => v.id === versionId);
    if (!version) throw new Error('Version not found');

    return this.estimationRepository.checkInventoryForVersion(version, companyId);
  }
}
