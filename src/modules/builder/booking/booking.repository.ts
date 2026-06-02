import { prisma } from '@config/prisma.config';
import { CreateBookingDTO, UpdateBookingDTO, CreatePaymentPlanDTO } from './booking.dto';

export class BookingRepository {
  async findAll(companyId: string) {
    return (prisma as any).booking.findMany({
      where: { companyId },
      include: {
        project: { select: { name: true } },
        unit: { select: { unitNumber: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async findById(id: string, companyId: string) {
    return (prisma as any).booking.findFirst({
      where: { id, companyId },
      include: {
        project: true,
        unit: true,
        paymentPlans: true
      }
    });
  }

  async create(data: CreateBookingDTO & { companyId: string }) {
    // Transaction to create booking and update unit status to BOOKED
    return (prisma as any).$transaction(async (tx: any) => {
      const booking = await tx.booking.create({
        data: {
          ...data,
          bookingDate: data.bookingDate ? new Date(data.bookingDate) : new Date(),
          status: 'PENDING'
        }
      });

      await tx.unit.update({
        where: { id: data.unitId },
        data: { status: 'BOOKED' }
      });

      return booking;
    });
  }

  async update(id: string, companyId: string, data: UpdateBookingDTO) {
    return (prisma as any).booking.updateMany({
      where: { id, companyId },
      data
    });
  }

  async delete(id: string, companyId: string, unitId: string) {
    return (prisma as any).$transaction([
      (prisma as any).booking.deleteMany({ where: { id, companyId } }),
      (prisma as any).unit.update({ where: { id: unitId }, data: { status: 'AVAILABLE' } })
    ]);
  }

  async updateStatus(id: string, companyId: string, status: string, unitId?: string, unitStatus?: string) {
    return (prisma as any).$transaction(async (tx: any) => {
      const booking = await tx.booking.update({
        where: { id },
        data: { status }
      });

      if (unitId && unitStatus) {
        await tx.unit.update({
          where: { id: unitId },
          data: { status: unitStatus }
        });
      }

      return booking;
    });
  }

  // --- Payment Plan Repos ---

  async getPaymentPlan(bookingId: string) {
    return (prisma as any).paymentPlan.findMany({
      where: { bookingId },
      orderBy: { createdAt: 'asc' }
    });
  }

  async createPaymentPlan(bookingId: string, items: CreatePaymentPlanDTO) {
    // Delete existing plan and create new one
    return (prisma as any).$transaction([
      (prisma as any).paymentPlan.deleteMany({ where: { bookingId } }),
      (prisma as any).paymentPlan.createMany({
        data: items.map(item => ({
          ...item,
          bookingId,
          dueDate: item.dueDate ? new Date(item.dueDate) : null
        }))
      })
    ]);
  }
}
