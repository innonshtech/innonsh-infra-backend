import { prisma } from '../../config/prisma.config';

export class AuthRepository {
  async findUserByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
      include: { company: true, role: true }
    });
  }

  async findSuperAdmin() {
    return prisma.user.findFirst({
      where: { role: { name: 'SUPERADMIN' } }
    });
  }

  async findUserById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      include: { company: true, role: true }
    });
  }

  async findUserByRefreshToken(refreshToken: string) {
    return prisma.user.findUnique({
      where: { refreshToken },
      include: { company: true, role: true }
    });
  }

  async findUserByResetToken(token: string) {
    return prisma.user.findFirst({
      where: {
        resetPasswordToken: token,
        resetPasswordExpire: { gt: new Date() }
      }
    });
  }

  async createUser(data: any) {
    return (prisma as any).user.create({ data, include: { company: true } });
  }

  async updateUser(id: string, data: any) {
    return (prisma as any).user.update({ where: { id }, data });
  }

  async createCompanyWithAdmin(companyData: any, userData: any, roleData: any) {
    return prisma.$transaction(async (tx: any) => {
      const company = await tx.company.create({ data: companyData });
      const role = await tx.role.create({
        data: {
          ...roleData,
          companyId: company.id
        }
      });
      const user = await tx.user.create({
        data: {
          ...userData,
          companyId: company.id,
          roleId: role.id
        },
        include: { company: true, role: true }
      });
      return { user, company };
    });
  }

  async createIndependentSuperadmin(userData: any, roleData: any) {
    return prisma.$transaction(async (tx: any) => {
      const role = await tx.role.create({
        data: roleData
      });
      const user = await tx.user.create({
        data: {
          ...userData,
          roleId: role.id
        },
        include: { role: true }
      });
      return { user };
    });
  }
}

export const authRepository = new AuthRepository();
