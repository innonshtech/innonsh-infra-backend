import { BrokerRepository } from './broker.repository';
import { BrokerDTO, UpdateBrokerDTO } from './broker.dto';

export class BrokerService {
  private repository: BrokerRepository;

  constructor() {
    this.repository = new BrokerRepository();
  }

  async getAllBrokers(companyId: string) {
    return this.repository.findAll(companyId);
  }

  async getBrokerById(id: string, companyId: string) {
    const broker = await this.repository.findById(id, companyId);
    if (!broker) throw new Error('Broker not found');
    return broker;
  }

  async createBroker(companyId: string, data: BrokerDTO) {
    return this.repository.create({ ...data, companyId });
  }

  async updateBroker(id: string, companyId: string, data: UpdateBrokerDTO) {
    return this.repository.update(id, companyId, data);
  }

  async deleteBroker(id: string, companyId: string) {
    return this.repository.delete(id, companyId);
  }

  async getBrokerClients(id: string, companyId: string) {
    // Verify broker exists first
    await this.getBrokerById(id, companyId);
    return this.repository.getClients(id, companyId);
  }
}
