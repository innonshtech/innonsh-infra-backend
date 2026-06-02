import { prisma } from '@config/prisma.config';
import { CreateTenantDTO, UpdateTenantDTO, CreateAgreementDTO, UpdateAgreementDTO, CollectRentDTO } from './lease.dto';

export class LeaseRepository {
  // --- Tenant Repos ---

  async findAllTenants(companyId: string) {
    return (prisma as any).tenant.findMany({
      where: { companyId },
      orderBy: { name: 'asc' }
    });
  }

  async findTenantById(id: string, companyId: string) {
    return (prisma as any).tenant.findFirst({
      where: { id, companyId },
      include: { agreements: true }
    });
  }

  async createTenant(data: CreateTenantDTO & { companyId: string }) {
    return (prisma as any).tenant.create({
      data
    });
  }

  async updateTenant(id: string, companyId: string, data: UpdateTenantDTO) {
    return (prisma as any).tenant.updateMany({
      where: { id, companyId },
      data
    });
  }

  async deleteTenant(id: string, companyId: string) {
    return (prisma as any).tenant.deleteMany({
      where: { id, companyId }
    });
  }

  // --- Agreement Repos ---

  async findAllAgreements(companyId: string) {
    return (prisma as any).leaseAgreement.findMany({
      where: { companyId },
      include: {
        tenant: { select: { name: true } },
        unit: { select: { unitNumber: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async findAgreementById(id: string, companyId: string) {
    return (prisma as any).leaseAgreement.findFirst({
      where: { id, companyId },
      include: {
        tenant: true,
        unit: true,
        rentCollections: true
      }
    });
  }

  async createAgreement(data: CreateAgreementDTO & { companyId: string }) {
    return (prisma as any).$transaction(async (tx: any) => {
      const agreement = await tx.leaseAgreement.create({
        data: {
          ...data,
          startDate: new Date(data.startDate),
          endDate: new Date(data.endDate)
        }
      });

      // Update unit status to BLOCKED/RENTED (assuming BLOCKED for now)
      await tx.unit.update({
        where: { id: data.unitId },
        data: { status: 'BLOCKED' }
      });

      return agreement;
    });
  }

  async updateAgreement(id: string, companyId: string, data: UpdateAgreementDTO) {
    const updateData: any = { ...data };
    if (data.endDate) updateData.endDate = new Date(data.endDate);

    return (prisma as any).leaseAgreement.updateMany({
      where: { id, companyId },
      data: updateData
    });
  }

  // --- Rent Collection Repos ---

  async findAllCollections(companyId: string) {
    return (prisma as any).rentCollection.findMany({
      where: { companyId },
      include: {
        agreement: {
          include: {
            tenant: { select: { name: true } },
            unit: { select: { unitNumber: true } }
          }
        }
      },
      orderBy: { paymentDate: 'desc' }
    });
  }

  async recordCollection(data: CollectRentDTO & { companyId: string }) {
    return (prisma as any).rentCollection.create({
      data
    });
  }
}
