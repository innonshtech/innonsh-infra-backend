import { prisma } from '../../config/prisma.config';
import { CompanyStatus } from './company.types';

export class CompanyRepository {
  async getAllCompanies(
    status?: CompanyStatus,
    skip?: number,
    take?: number
  ) {
    const where: any = {};

    if (status) {
      where.status = status;
    }

    return prisma.company.findMany({
      where,
      include: {
        users: true,
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    });
  }

  async updateCompanyStatus(id: string, status: CompanyStatus) {
    return prisma.company.update({
      where: { id },
      data: { status },
    });
  }
}

export const companyRepository = new CompanyRepository();