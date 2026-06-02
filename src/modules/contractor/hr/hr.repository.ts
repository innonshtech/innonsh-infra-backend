import { prisma } from '../../../config/prisma.config';

export class LabourRepository {
  // ─── Workers ───
  async findAllWorkers(companyId: string, filters?: { projectId?: string; role?: string; status?: string }) {
    try {
      const where: any = { companyId };
      if (filters?.projectId) where.projectId = filters.projectId;
      if (filters?.role) where.role = filters.role;
      if (filters?.status) where.status = filters.status;

      return (prisma as any).worker.findMany({
        where,
        include: { project: { select: { name: true } } },
        orderBy: { firstName: 'asc' }
      });
    } catch (error) {
      console.error('[LabourRepository] findAllWorkers Error:', error);
      throw error;
    }
  }

  async findWorkerById(id: string, companyId: string) {
    return (prisma as any).worker.findFirst({
      where: { id, companyId },
      include: { project: { select: { name: true } }, attendance: { orderBy: { date: 'desc' }, take: 30 } }
    });
  }

  async createWorker(data: any) {
    try {
      return (prisma as any).worker.create({ data });
    } catch (error) {
      console.error('[LabourRepository] createWorker Error:', error);
      throw error;
    }
  }

  async updateWorker(id: string, companyId: string, data: any) {
    return (prisma as any).worker.updateMany({ where: { id, companyId }, data });
  }

  async deleteWorker(id: string, companyId: string) {
    return (prisma as any).worker.deleteMany({ where: { id, companyId } });
  }

  async getWorkerCount(companyId: string) {
    const total = await (prisma as any).worker.count({ where: { companyId } });
    const active = await (prisma as any).worker.count({ where: { companyId, status: 'ACTIVE' } });
    return { total, active, inactive: total - active };
  }

  // ─── Attendance ───
  async findAttendance(companyId: string, date: string, projectId?: string) {
    const where: any = { companyId, date: new Date(date) };
    if (projectId) where.projectId = projectId;

    return (prisma as any).attendance.findMany({
      where,
      include: { worker: { select: { firstName: true, lastName: true, role: true, dailyWage: true } } },
      orderBy: { worker: { firstName: 'asc' } }
    });
  }

  async upsertAttendance(data: { companyId: string; workerId: string; projectId?: string; date: string; status: string; wageAmount: number }) {
    const dateObj = new Date(data.date);
    return (prisma as any).attendance.upsert({
      where: { workerId_date: { workerId: data.workerId, date: dateObj } },
      update: { status: data.status, wageAmount: data.wageAmount, projectId: data.projectId },
      create: { ...data, date: dateObj }
    });
  }

  async bulkUpsertAttendance(records: Array<{ companyId: string; workerId: string; projectId?: string; date: string; status: string; wageAmount: number }>) {
    const results = [];
    for (const record of records) {
      const result = await this.upsertAttendance(record);
      results.push(result);
    }
    return results;
  }

  async getAttendanceSummary(companyId: string, date: string, projectId?: string) {
    const where: any = { companyId, date: new Date(date) };
    if (projectId) where.projectId = projectId;

    const records = await (prisma as any).attendance.findMany({ where });
    const present = records.filter((r: any) => r.status === 'PRESENT').length;
    const absent = records.filter((r: any) => r.status === 'ABSENT').length;
    const halfDay = records.filter((r: any) => r.status === 'HALF_DAY').length;
    const totalWage = records.reduce((s: number, r: any) => s + r.wageAmount, 0);

    return { present, absent, halfDay, total: records.length, totalWage };
  }

  // ─── Payroll ───
  async getPayroll(companyId: string, startDate: string, endDate: string, projectId?: string) {
    const where: any = {
      companyId,
      date: { gte: new Date(startDate), lte: new Date(endDate) }
    };
    if (projectId) where.projectId = projectId;

    const records = await (prisma as any).attendance.findMany({
      where,
      include: { worker: { select: { id: true, firstName: true, lastName: true, role: true, dailyWage: true } } }
    });

    // Group by worker
    const workerMap: Record<string, any> = {};
    for (const r of records) {
      if (!workerMap[r.workerId]) {
        workerMap[r.workerId] = {
          worker: r.worker,
          daysWorked: 0,
          halfDays: 0,
          totalWage: 0
        };
      }
      if (r.status === 'PRESENT') workerMap[r.workerId].daysWorked++;
      if (r.status === 'HALF_DAY') { workerMap[r.workerId].halfDays++; workerMap[r.workerId].daysWorked += 0.5; }
      workerMap[r.workerId].totalWage += r.wageAmount;
    }

    const breakdown = Object.values(workerMap);
    const totalPayroll = breakdown.reduce((s: number, w: any) => s + w.totalWage, 0);
    const totalWorkers = breakdown.length;

    return { totalPayroll, totalWorkers, breakdown };
  }
}
