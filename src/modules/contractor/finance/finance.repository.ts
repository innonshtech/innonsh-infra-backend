import { prisma } from '../../../config/prisma.config';
import { CreateInvoiceDTO, UpdateInvoiceDTO, CreateTransactionDTO, CreatePaymentDTO } from './finance.dto';

export class FinanceRepository {
  // --- Invoice Repos ---

  async findAllInvoices(companyId: string) {
    return (prisma as any).invoice.findMany({
      where: { companyId },
      include: {
        project: { select: { name: true } },
        _count: { select: { payments: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async findInvoiceById(id: string, companyId: string) {
    return (prisma as any).invoice.findFirst({
      where: { id, companyId },
      include: {
        items: true,
        payments: true
      }
    });
  }

  async createInvoice(data: CreateInvoiceDTO & { companyId: string, invoiceNumber: string }) {
    const totalAmount = data.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    return (prisma as any).invoice.create({
      data: {
        companyId: data.companyId,
        projectId: data.projectId,
        invoiceNumber: data.invoiceNumber,
        clientName: data.clientName,
        totalAmount,
        dueAmount: totalAmount,
        dueDate: new Date(data.dueDate),
        items: {
          create: data.items.map(item => ({
            ...item,
            amount: item.quantity * item.unitPrice
          }))
        }
      },
      include: { items: true }
    });
  }

  async updateInvoice(id: string, companyId: string, data: UpdateInvoiceDTO) {
    return (prisma as any).invoice.updateMany({
      where: { id, companyId },
      data
    });
  }

  async deleteInvoice(id: string, companyId: string) {
    return (prisma as any).invoice.deleteMany({
      where: { id, companyId }
    });
  }

  async getLatestInvoiceNumber(companyId: string) {
    return (prisma as any).invoice.findFirst({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
      select: { invoiceNumber: true }
    });
  }

  // --- Transaction Repos ---

  async findAllTransactions(companyId: string) {
    return (prisma as any).transaction.findMany({
      where: { companyId },
      orderBy: { date: 'desc' }
    });
  }

  async createTransaction(data: CreateTransactionDTO & { companyId: string }) {
    return (prisma as any).transaction.create({
      data: {
        ...data,
        date: data.date ? new Date(data.date) : new Date()
      }
    });
  }

  // --- Payment Repos ---

  async findAllPayments(companyId: string) {
    return (prisma as any).payment.findMany({
      where: { companyId },
      include: {
        invoice: { select: { invoiceNumber: true } },
        transaction: true
      },
      orderBy: { paymentDate: 'desc' }
    });
  }

  async createPayment(data: CreatePaymentDTO & { companyId: string, transactionId?: string }) {
    const { paymentMethod, notes, ...rest } = data;
    return (prisma as any).payment.create({
      data: {
        ...rest,
        method: paymentMethod,
        paymentDate: data.paymentDate ? new Date(data.paymentDate) : new Date(),
        transactionId: data.transactionId
      }
    });
  }

  async updateInvoicePayments(invoiceId: string, amount: number) {
    const invoice = await (prisma as any).invoice.findUnique({ where: { id: invoiceId } });
    if (!invoice) return;

    const newPaidAmount = invoice.paidAmount + amount;
    const newDueAmount = invoice.totalAmount - newPaidAmount;
    let newStatus = invoice.status;

    if (newPaidAmount >= invoice.totalAmount) {
      newStatus = 'PAID';
    } else if (newPaidAmount > 0) {
      newStatus = 'PARTIAL';
    }

    return (prisma as any).invoice.update({
      where: { id: invoiceId },
      data: {
        paidAmount: newPaidAmount,
        dueAmount: Math.max(0, newDueAmount),
        status: newStatus
      }
    });
  }
}
