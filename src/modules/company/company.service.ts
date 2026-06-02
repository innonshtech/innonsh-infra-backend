import { companyRepository } from './company.repository';
import { CompanyStatus } from './company.types';

export class CompanyService {
  async fetchCompanies(
    status?: CompanyStatus,
    page: number = 1,
    limit: number = 10
  ) {
    const skip = (page - 1) * limit;

    return companyRepository.getAllCompanies(status, skip, limit);
  }

  async approveCompany(id: string) {
    return companyRepository.updateCompanyStatus(
      id,
      CompanyStatus.ACTIVE
    );
  }

  async rejectCompany(id: string) {
    return companyRepository.updateCompanyStatus(
      id,
      CompanyStatus.REJECTED
    );
  }

  async updateCompanyStatus(id: string, status: CompanyStatus) {
    return companyRepository.updateCompanyStatus(id, status);
  }
}

export const companyService = new CompanyService();