import { prisma } from '@config/prisma.config';
import { ReportQueryDTO } from './reports.dto';

export class ReportsRepository {
  async getDashboardStats(companyId: string) {
    const [projects, units, bookings, invoices] = await Promise.all([
      (prisma as any).project.count({ where: { companyId } }),
      (prisma as any).unit.groupBy({
        where: { companyId },
        by: ['status'],
        _count: true
      }),
      (prisma as any).booking.count({ where: { companyId } }),
      (prisma as any).builderInvoice.aggregate({
        where: { companyId },
        _sum: {
          grandTotal: true,
          paidAmount: true,
          dueAmount: true
        }
      })
    ]);

    const unitStats = units.reduce((acc: any, curr: any) => {
      acc[curr.status.toLowerCase()] = curr._count;
      return acc;
    }, {});

    return {
      totalProjects: projects,
      inventory: unitStats,
      totalBookings: bookings,
      financials: {
        totalRevenue: invoices._sum.grandTotal || 0,
        totalCollected: invoices._sum.paidAmount || 0,
        totalOutstanding: invoices._sum.dueAmount || 0
      }
    };
  }

  async getSalesReport(companyId: string, query: ReportQueryDTO) {
    const where: any = { companyId };
    if (query.projectId) where.projectId = query.projectId;
    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) where.createdAt.gte = new Date(query.startDate);
      if (query.endDate) where.createdAt.lte = new Date(query.endDate);
    }

    return (prisma as any).booking.findMany({
      where,
      select: {
        id: true,
        clientName: true,
        totalAmount: true,
        bookingDate: true,
        status: true,
        project: { select: { name: true } },
        unit: { select: { unitNumber: true } }
      },
      orderBy: { bookingDate: 'desc' }
    });
  }

  async getRevenueReport(companyId: string, query: ReportQueryDTO) {
    const where: any = { companyId };
    if (query.projectId) where.booking = { projectId: query.projectId };
    
    return (prisma as any).builderPayment.findMany({
      where,
      include: {
        booking: { select: { clientName: true, project: { select: { name: true } } } }
      },
      orderBy: { paymentDate: 'desc' }
    });
  }

  async getDuesReport(companyId: string, query: ReportQueryDTO) {
    const where: any = { 
      companyId,
      status: { in: ['UNPAID', 'PARTIAL'] },
      dueAmount: { gt: 0 }
    };
    if (query.projectId) where.booking = { projectId: query.projectId };

    return (prisma as any).builderInvoice.findMany({
      where,
      include: {
        booking: { select: { clientName: true, clientPhone: true, project: { select: { name: true } } } }
      },
      orderBy: { dueDate: 'asc' }
    });
  }
}
