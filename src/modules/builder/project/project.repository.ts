import { prisma } from '@config/prisma.config';
import { CreateBuilderProjectDTO, UpdateBuilderProjectDTO } from './project.dto';
import { CreateUnitDTO, UpdateUnitDTO, CreateBookingDTO, CreateLeadDTO } from './builder.dto';

export class BuilderProjectRepository {
  async findAll(companyId: string) {
    return (prisma as any).project.findMany({
      where: { companyId },
      include: {
        _count: {
          select: {
            members: true,
            units: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async findById(id: string, companyId: string) {
    return (prisma as any).project.findFirst({
      where: { id, companyId },
      include: {
        members: { include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } } },
        progressUpdates: { orderBy: { updatedAt: 'desc' }, take: 10 },
        tasks: { where: { parentId: null }, include: { subTasks: true } },
        units: { take: 20 },
        workers: { orderBy: { createdAt: 'desc' } },
        equipment: { orderBy: { createdAt: 'desc' } },
        invoices: { orderBy: { createdAt: 'desc' }, take: 20 },
        procurementRequests: { orderBy: { createdAt: 'desc' }, take: 20, include: { items: true } },
      }
    });
  }

  async create(data: CreateBuilderProjectDTO & { companyId: string }) {
    return (prisma as any).project.create({ data });
  }

  async update(id: string, companyId: string, data: UpdateBuilderProjectDTO) {
    return (prisma as any).project.updateMany({
      where: { id, companyId },
      data
    });
  }

  async delete(id: string, companyId: string) {
    return (prisma as any).project.deleteMany({
      where: { id, companyId }
    });
  }

  // --- Unit Management ---
  async createUnit(companyId: string, data: CreateUnitDTO) {
    return (prisma as any).unit.create({
      data: { ...data, companyId }
    });
  }

  async getUnits(projectId: string, companyId: string) {
    return (prisma as any).unit.findMany({
      where: { projectId, companyId },
      include: { bookings: { take: 1 } },
      orderBy: [{ floorNumber: 'asc' }, { unitNumber: 'asc' }]
    });
  }

  async updateUnit(id: string, companyId: string, data: UpdateUnitDTO) {
    return (prisma as any).unit.update({
      where: { id, companyId },
      data
    });
  }

  // --- CRM / Leads ---
  async createLead(companyId: string, data: CreateLeadDTO) {
    return (prisma as any).lead.create({
      data: { ...data, companyId }
    });
  }

  async getLeads(companyId: string, projectId?: string) {
    return (prisma as any).lead.findMany({
      where: { companyId, ...(projectId ? { projectId } : {}) },
      orderBy: { createdAt: 'desc' }
    });
  }

  // --- Bookings ---
  async createBooking(companyId: string, data: CreateBookingDTO) {
    // Transaction to create booking and update unit status
    return (prisma as any).$transaction(async (tx: any) => {
      const booking = await tx.booking.create({
        data: { ...data, companyId }
      });
      await tx.unit.update({
        where: { id: data.unitId },
        data: { status: 'BOOKED' }
      });
      return booking;
    });
  }

  async getBookings(projectId: string, companyId: string) {
    return (prisma as any).booking.findMany({
      where: { projectId, companyId },
      include: {
        unit: true,
        customer: true
      },
      orderBy: { bookingDate: 'desc' }
    });
  }

  async getDashboardStats(projectId: string, companyId: string) {
    const [units, bookings] = await Promise.all([
      (prisma as any).unit.findMany({ where: { projectId, companyId } }),
      (prisma as any).booking.findMany({ where: { projectId, companyId } })
    ]);

    const totalUnits = units.length;
    const bookedUnits = units.filter((u: any) => u.status === 'BOOKED' || u.status === 'SOLD').length;
    const availableUnits = totalUnits - bookedUnits;
    const totalCollected = bookings.reduce((sum: number, b: any) => sum + b.paidAmount, 0);
    const totalRevenue = bookings.reduce((sum: number, b: any) => sum + b.totalAmount, 0);

    return {
      inventory: {
        total: totalUnits,
        booked: bookedUnits,
        available: availableUnits,
        occupancyRate: totalUnits > 0 ? Math.round((bookedUnits / totalUnits) * 100) : 0
      },
      financials: {
        totalRevenue,
        totalCollected,
        pendingCollection: totalRevenue - totalCollected
      }
    };
  }
}
