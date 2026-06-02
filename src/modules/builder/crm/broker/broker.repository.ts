import { prisma } from '@config/prisma.config';
import { BrokerDTO, UpdateBrokerDTO } from './broker.dto';

export class BrokerRepository {
  async findAll(companyId: string) {
    return (prisma as any).broker.findMany({
      where: { companyId },
      include: {
        _count: { select: { clients: true } }
      },
      orderBy: { name: 'asc' }
    });
  }

  async findById(id: string, companyId: string) {
    return (prisma as any).broker.findFirst({
      where: { id, companyId },
      include: {
        clients: true
      }
    });
  }

  async create(data: BrokerDTO & { companyId: string }) {
    return (prisma as any).broker.create({
      data
    });
  }

  async update(id: string, companyId: string, data: UpdateBrokerDTO) {
    return (prisma as any).broker.updateMany({
      where: { id, companyId },
      data
    });
  }

  async delete(id: string, companyId: string) {
    return (prisma as any).broker.deleteMany({
      where: { id, companyId }
    });
  }

  async getClients(brokerId: string, companyId: string) {
    return (prisma as any).brokerClient.findMany({
      where: { brokerId, companyId },
      orderBy: { createdAt: 'desc' }
    });
  }
}
