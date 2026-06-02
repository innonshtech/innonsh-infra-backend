import { FinanceRepository } from './finance.repository';
import { CreateInvoiceDTO, UpdateInvoiceDTO, CreateTransactionDTO, CreatePaymentDTO } from './finance.dto';

export class FinanceService {
  private repository: FinanceRepository;

  constructor() {
    this.repository = new FinanceRepository();
  }

  // --- Invoice Logic ---

  async getAllInvoices(companyId: string) {
    return this.repository.findAllInvoices(companyId);
  }

  async createInvoice(companyId: string, data: CreateInvoiceDTO) {
    // Generate Invoice Number: INV-YYYYMMDD-XXXX
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const latest = await this.repository.getLatestInvoiceNumber(companyId);
    let sequence = '0001';

    if (latest && latest.invoiceNumber.includes(dateStr)) {
      const lastSeq = parseInt(latest.invoiceNumber.split('-').pop() || '0');
      sequence = (lastSeq + 1).toString().padStart(4, '0');
    }

    const invoiceNumber = `INV-${dateStr}-${sequence}`;
    return this.repository.createInvoice({ ...data, companyId, invoiceNumber });
  }

  async updateInvoice(id: string, companyId: string, data: UpdateInvoiceDTO) {
    return this.repository.updateInvoice(id, companyId, data);
  }

  async deleteInvoice(id: string, companyId: string) {
    return this.repository.deleteInvoice(id, companyId);
  }

  // --- Transaction Logic ---

  async getAllTransactions(companyId: string) {
    return this.repository.findAllTransactions(companyId);
  }

  async createTransaction(companyId: string, data: CreateTransactionDTO) {
    return this.repository.createTransaction({ ...data, companyId });
  }

  // --- Payment Logic (Linked to Transactions) ---

  async getAllPayments(companyId: string) {
    return this.repository.findAllPayments(companyId);
  }

  /**
   * Complex Payment Logic:
   * 1. Records the Payment.
   * 2. Automatically creates a linked Transaction (as INCOME).
   * 3. Updates the Invoice status and paid balance.
   */
  async recordPayment(companyId: string, data: CreatePaymentDTO) {
    // 1. Create a Transaction first for this payment
    const transaction = await this.repository.createTransaction({
      companyId,
      type: 'INCOME',
      category: 'INVOICE_PAYMENT',
      amount: data.amount,
      description: `Payment received for Invoice ${data.invoiceId || 'N/A'}${data.notes ? ` (${data.notes})` : ''}`,
      date: data.paymentDate,
    });

    // 2. Record the Payment linked to this transaction
    const payment = await this.repository.createPayment({
      ...data,
      companyId,
      transactionId: transaction.id
    });

    // 3. Update Invoice if provided
    if (data.invoiceId) {
      await this.repository.updateInvoicePayments(data.invoiceId, data.amount);
    }

    return payment;
  }
}
