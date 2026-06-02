import { LabourRepository } from './hr.repository';
import { prisma } from '@config/prisma.config';

export class LabourService {
  private repo: LabourRepository;

  constructor() {
    this.repo = new LabourRepository();
  }

  // Workers
  async getWorkers(companyId: string, filters?: { projectId?: string; role?: string; status?: string }) {
    return this.repo.findAllWorkers(companyId, filters);
  }

  async getWorkerById(id: string, companyId: string) {
    return this.repo.findWorkerById(id, companyId);
  }

  async createWorker(companyId: string, data: any) {
    return this.repo.createWorker({ ...data, companyId });
  }

  async updateWorker(id: string, companyId: string, data: any) {
    return this.repo.updateWorker(id, companyId, data);
  }

  async deleteWorker(id: string, companyId: string) {
    return this.repo.deleteWorker(id, companyId);
  }

  async getWorkerStats(companyId: string) {
    return this.repo.getWorkerCount(companyId);
  }

  // Attendance
  async getAttendance(companyId: string, date: string, projectId?: string) {
    return this.repo.findAttendance(companyId, date, projectId);
  }

  async saveAttendance(companyId: string, records: Array<{ workerId: string; projectId?: string; date: string; status: string; wageAmount: number }>) {
    const enriched = records.map(r => ({ ...r, companyId }));
    return this.repo.bulkUpsertAttendance(enriched);
  }

  async getAttendanceSummary(companyId: string, date: string, projectId?: string) {
    return this.repo.getAttendanceSummary(companyId, date, projectId);
  }

  // Payroll
  async getPayroll(companyId: string, startDate: string, endDate: string, projectId?: string) {
    return this.repo.getPayroll(companyId, startDate, endDate, projectId);
  }

  /**
   * Finalize Payroll: Auto-create EXPENSE transaction for labour wages.
   * This bridges the Labour module to the Finance module.
   */
  async finalizePayroll(companyId: string, startDate: string, endDate: string, projectId?: string) {
    const payroll = await this.repo.getPayroll(companyId, startDate, endDate, projectId);

    if (payroll.totalPayroll <= 0) {
      throw new Error('No wages to process for this period');
    }

    // Create an EXPENSE transaction for wages
    const txn = await (prisma as any).transaction.create({
      data: {
        companyId,
        type: 'EXPENSE',
        category: 'LABOUR_WAGES',
        amount: payroll.totalPayroll,
        description: `Labour Wages (${new Date(startDate).toLocaleDateString('en-IN')} - ${new Date(endDate).toLocaleDateString('en-IN')}) — ${payroll.totalWorkers} workers`,
        date: new Date(),
      }
    });

    return { transaction: txn, payroll };
  }
}
