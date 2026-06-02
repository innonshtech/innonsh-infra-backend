import { prisma } from '@config/prisma.config';
import { CreateInvoiceDTO, UpdateInvoiceDTO, RecordPaymentDTO } from './billing.dto';

export class BillingRepository {
  // --- Invoice Repos ---

  async findAllInvoices(companyId: string) {
    return (prisma as any).builderInvoice.findMany({
      where: { companyId },
      include: {
        booking: {
          include: {
            project: { select: { name: true } },
            unit: { select: { unitNumber: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async findInvoiceById(id: string, companyId: string) {
    return (prisma as any).builderInvoice.findFirst({
      where: { id, companyId },
      include: {
        payments: true,
        booking: {
          include: { project: true, unit: true }
        }
      }
    });
  }

  async createInvoice(data: CreateInvoiceDTO & { companyId: string, invoiceNumber: string }) {
    const grandTotal = data.totalAmount + (data.taxAmount || 0);
    return (prisma as any).builderInvoice.create({
      data: {
        ...data,
        grandTotal,
        dueAmount: grandTotal,
        dueDate: new Date(data.dueDate)
      }
    });
  }

  async updateInvoice(id: string, companyId: string, data: UpdateInvoiceDTO) {
    return (prisma as any).builderInvoice.updateMany({
      where: { id, companyId },
      data
    });
  }

  async deleteInvoice(id: string, companyId: string) {
    return (prisma as any).builderInvoice.deleteMany({
      where: { id, companyId }
    });
  }

  async getLatestInvoiceNumber(companyId: string) {
    return (prisma as any).builderInvoice.findFirst({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
      select: { invoiceNumber: true }
    });
  }

  // --- Payment Repos ---

  async findAllPayments(companyId: string) {
    return (prisma as any).builderPayment.findMany({
      where: { companyId },
      include: {
        booking: {
          include: {
            customer: { select: { name: true } }
          }
        },
        invoice: { select: { invoiceNumber: true } }
      },
      orderBy: { paymentDate: 'desc' }
    });
  }

  async recordPayment(data: RecordPaymentDTO & { companyId: string }) {
    return (prisma as any).$transaction(async (tx: any) => {
      const payment = await tx.builderPayment.create({
        data: {
          ...data,
          paymentDate: data.paymentDate ? new Date(data.paymentDate) : new Date()
        }
      });

      // If linked to invoice, update invoice status
      if (data.invoiceId) {
        const invoice = await tx.builderInvoice.findUnique({ where: { id: data.invoiceId } });
        if (invoice) {
          const newPaidAmount = invoice.paidAmount + data.amount;
          const newDueAmount = Math.max(0, invoice.grandTotal - newPaidAmount);
          const newStatus = newDueAmount === 0 ? 'PAID' : 'PARTIAL';

          await tx.builderInvoice.update({
            where: { id: data.invoiceId },
            data: {
              paidAmount: newPaidAmount,
              dueAmount: newDueAmount,
              status: newStatus
            }
          });
        }
      }

      // Update total paid amount on Booking (optional, but good for reporting)
      await tx.booking.update({
        where: { id: data.bookingId },
        data: {
          paidAmount: { increment: data.amount }
        }
      });

      return payment;
    });
  }

  // --- Reports & Dues ---

  async getDues(companyId: string) {
    return (prisma as any).builderInvoice.findMany({
      where: { 
        companyId,
        status: { in: ['UNPAID', 'PARTIAL'] },
        dueAmount: { gt: 0 }
      },
      include: {
        booking: {
          include: {
            customer: { select: { name: true, phone: true } }
          }
        }
      },
      orderBy: { dueDate: 'asc' }
    });
  }

  async getSummary(companyId: string) {
    const invoices = await (prisma as any).builderInvoice.findMany({ where: { companyId } });
    const payments = await (prisma as any).builderPayment.findMany({ where: { companyId } });

    const totalInvoiced = invoices.reduce((sum: number, inv: any) => sum + inv.grandTotal, 0);
    const totalCollected = payments.reduce((sum: number, p: any) => sum + p.amount, 0);

    return {
      totalInvoiced,
      totalCollected,
      totalDue: totalInvoiced - totalCollected,
      collectionEfficiency: totalInvoiced > 0 ? (totalCollected / totalInvoiced) * 100 : 0
    };
  }
}
