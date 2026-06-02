import { prisma } from '../../../config/prisma.config';
import { CreateUserDTO, UpdateUserDTO } from './users.dto';

export class UsersRepository {
  async findAll(companyId: string) {
    return prisma.user.findMany({
      where: { companyId },
      include: {
        role: true,
      },
    });
  }

  async findById(id: string, companyId: string) {
    return prisma.user.findFirst({
      where: { id, companyId },
      include: {
        role: true,
      },
    });
  }

  async findByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
    });
  }

  async create(data: CreateUserDTO & { companyId: string }) {
    return prisma.user.create({
      data,
      include: {
        role: true,
      },
    });
  }

  async update(id: string, companyId: string, data: UpdateUserDTO) {
    return prisma.user.updateMany({
      where: { id, companyId },
      data,
    });
  }

  async delete(id: string, companyId: string) {
    return prisma.user.deleteMany({
      where: { id, companyId },
    });
  }

  async updateRole(id: string, companyId: string, roleId: string) {
    return prisma.user.updateMany({
      where: { id, companyId },
      data: { roleId },
    });
  }

  async updateStatus(id: string, companyId: string, isActive: boolean) {
    return prisma.user.updateMany({
      where: { id, companyId },
      data: { isActive },
    });
  }
}
