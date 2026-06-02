import { ReportsRepository } from './reports.repository';
import { ReportQueryDTO } from './reports.dto';

export class ReportsService {
  private repository: ReportsRepository;

  constructor() {
    this.repository = new ReportsRepository();
  }

  async getDashboardData(companyId: string) {
    return this.repository.getDashboardStats(companyId);
  }

  async getSalesReport(companyId: string, query: ReportQueryDTO) {
    return this.repository.getSalesReport(companyId, query);
  }

  async getRevenueReport(companyId: string, query: ReportQueryDTO) {
    return this.repository.getRevenueReport(companyId, query);
  }

  async getDuesReport(companyId: string, query: ReportQueryDTO) {
    return this.repository.getDuesReport(companyId, query);
  }

  async getBookingsReport(companyId: string, query: ReportQueryDTO) {
    // Similar to sales but focuses on pipeline
    return this.repository.getSalesReport(companyId, query);
  }
}
