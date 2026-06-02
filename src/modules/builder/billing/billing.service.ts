import { BillingRepository } from './billing.repository';
import { CreateInvoiceDTO, UpdateInvoiceDTO, RecordPaymentDTO } from './billing.dto';

export class BillingService {
  private repository: BillingRepository;

  constructor() {
    this.repository = new BillingRepository();
  }

  // --- Invoice Logic ---

  async getAllInvoices(companyId: string) {
    return this.repository.findAllInvoices(companyId);
  }

  async getInvoiceById(id: string, companyId: string) {
    const invoice = await this.repository.findInvoiceById(id, companyId);
    if (!invoice) throw new Error('Invoice not found');
    return invoice;
  }

  async createInvoice(companyId: string, data: CreateInvoiceDTO) {
    // Generate Invoice Number: DINV-YYYYMMDD-XXXX (D for Demand Letter/Invoice)
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const latest = await this.repository.getLatestInvoiceNumber(companyId);
    let sequence = '0001';

    if (latest && latest.invoiceNumber.includes(dateStr)) {
      const lastSeq = parseInt(latest.invoiceNumber.split('-').pop() || '0');
      sequence = (lastSeq + 1).toString().padStart(4, '0');
    }

    const invoiceNumber = `DINV-${dateStr}-${sequence}`;
    return this.repository.createInvoice({ ...data, companyId, invoiceNumber });
  }

  async updateInvoice(id: string, companyId: string, data: UpdateInvoiceDTO) {
    return this.repository.updateInvoice(id, companyId, data);
  }

  async deleteInvoice(id: string, companyId: string) {
    return this.repository.deleteInvoice(id, companyId);
  }

  // --- Payment Logic ---

  async getAllPayments(companyId: string) {
    return this.repository.findAllPayments(companyId);
  }

  async recordPayment(companyId: string, data: RecordPaymentDTO) {
    return this.repository.recordPayment({ ...data, companyId });
  }

  // --- Reports ---

  async getPendingDues(companyId: string) {
    return this.repository.getDues(companyId);
  }

  async getFinancialReports(companyId: string) {
    return this.repository.getSummary(companyId);
  }
}
