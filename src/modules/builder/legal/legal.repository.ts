import { prisma } from '@config/prisma.config';
import { 
  CreateLegalDocumentDTO, 
  UpdateLegalDocumentDTO, 
  CreateLegalApprovalDTO, 
  CreateComplianceRecordDTO 
} from './legal.dto';

export class LegalRepository {
  // --- Legal Document Repos ---

  async findAllDocuments(companyId: string) {
    return (prisma as any).legalDocument.findMany({
      where: { companyId },
      include: {
        project: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async findDocumentById(id: string, companyId: string) {
    return (prisma as any).legalDocument.findFirst({
      where: { id, companyId }
    });
  }

  async createDocument(data: CreateLegalDocumentDTO & { companyId: string }) {
    const { expiryDate, ...rest } = data;
    return (prisma as any).legalDocument.create({
      data: {
        ...rest,
        expiryDate: expiryDate ? new Date(expiryDate) : null
      }
    });
  }

  async updateDocument(id: string, companyId: string, data: UpdateLegalDocumentDTO) {
    return (prisma as any).legalDocument.updateMany({
      where: { id, companyId },
      data
    });
  }

  async deleteDocument(id: string, companyId: string) {
    return (prisma as any).legalDocument.deleteMany({
      where: { id, companyId }
    });
  }

  // --- Legal Approval Repos ---

  async findAllApprovals(companyId: string) {
    return (prisma as any).legalApproval.findMany({
      where: { companyId },
      include: {
        project: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async createApproval(data: CreateLegalApprovalDTO & { companyId: string }) {
    const { approvalDate, validUntil, ...rest } = data;
    return (prisma as any).legalApproval.create({
      data: {
        ...rest,
        approvalDate: approvalDate ? new Date(approvalDate) : null,
        validUntil: validUntil ? new Date(validUntil) : null
      }
    });
  }

  // --- Compliance Record Repos ---

  async findAllCompliance(companyId: string) {
    return (prisma as any).complianceRecord.findMany({
      where: { companyId },
      include: {
        project: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async createCompliance(data: CreateComplianceRecordDTO & { companyId: string }) {
    const { lastAuditDate, nextAuditDate, ...rest } = data;
    return (prisma as any).complianceRecord.create({
      data: {
        ...rest,
        lastAuditDate: lastAuditDate ? new Date(lastAuditDate) : null,
        nextAuditDate: nextAuditDate ? new Date(nextAuditDate) : null
      }
    });
  }
}
