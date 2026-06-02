import { LegalRepository } from './legal.repository';
import { 
  CreateLegalDocumentDTO, 
  UpdateLegalDocumentDTO, 
  CreateLegalApprovalDTO, 
  CreateComplianceRecordDTO 
} from './legal.dto';

export class LegalService {
  private repository: LegalRepository;

  constructor() {
    this.repository = new LegalRepository();
  }

  // --- Document Logic ---

  async getAllDocuments(companyId: string) {
    return this.repository.findAllDocuments(companyId);
  }

  async getDocumentById(id: string, companyId: string) {
    const doc = await this.repository.findDocumentById(id, companyId);
    if (!doc) throw new Error('Legal document not found');
    return doc;
  }

  async createDocument(companyId: string, data: CreateLegalDocumentDTO) {
    return this.repository.createDocument({ ...data, companyId });
  }

  async updateDocument(id: string, companyId: string, data: UpdateLegalDocumentDTO) {
    return this.repository.updateDocument(id, companyId, data);
  }

  async deleteDocument(id: string, companyId: string) {
    return this.repository.deleteDocument(id, companyId);
  }

  // --- Approval Logic ---

  async getAllApprovals(companyId: string) {
    return this.repository.findAllApprovals(companyId);
  }

  async recordApproval(companyId: string, data: CreateLegalApprovalDTO) {
    return this.repository.createApproval({ ...data, companyId });
  }

  // --- Compliance Logic ---

  async getAllCompliance(companyId: string) {
    return this.repository.findAllCompliance(companyId);
  }

  async recordCompliance(companyId: string, data: CreateComplianceRecordDTO) {
    return this.repository.createCompliance({ ...data, companyId });
  }
}
