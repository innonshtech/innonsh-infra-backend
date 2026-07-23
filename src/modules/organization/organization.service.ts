import { prisma } from '../../config/prisma.config';
import { AppError } from '../../middleware/error.middleware';

export class OrganizationService {
  // Get Company Profile & Settings
  async getProfile(companyId: string) {
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      include: {
        settings: true,
      },
    });

    if (!company) {
      throw new AppError('Company not found', 404);
    }

    // Auto-create settings if not exists
    if (!company.settings) {
      const defaultSettings = await prisma.companySetting.create({
        data: {
          companyId,
          currency: 'INR',
          timeZone: 'IST',
          financialYear: '2026-2027',
          dateFormat: 'DD/MM/YYYY',
          numberFormat: 'INR',
        },
      });
      (company as any).settings = defaultSettings;
    }

    return company;
  }

  // Update Company Profile
  async updateProfile(companyId: string, data: any) {
    return prisma.company.update({
      where: { id: companyId },
      data: {
        name: data.name,
        logo: data.logo,
        code: data.code,
        gstNumber: data.gstNumber,
        panNumber: data.panNumber,
        regNumber: data.regNumber,
        ownerName: data.ownerName,
        email: data.email,
        phone: data.phone,
        website: data.website,
        address: data.address,
        city: data.city,
        state: data.state,
        country: data.country,
        pincode: data.pincode,
      },
    });
  }

  // Update Company Settings
  async updateSettings(companyId: string, data: any) {
    // Check if settings exists
    const settings = await prisma.companySetting.findUnique({
      where: { companyId },
    });

    if (settings) {
      return prisma.companySetting.update({
        where: { companyId },
        data,
      });
    } else {
      return prisma.companySetting.create({
        data: {
          companyId,
          ...data,
        },
      });
    }
  }

  // Branches CRUD
  async getBranches(companyId: string) {
    return prisma.branch.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createBranch(companyId: string, data: any) {
    return prisma.branch.create({
      data: {
        companyId,
        name: data.name,
        code: data.code,
        address: data.address,
        city: data.city,
        state: data.state,
        phone: data.phone,
        email: data.email,
        managerName: data.managerName,
      },
    });
  }

  async updateBranch(id: string, companyId: string, data: any) {
    const branch = await prisma.branch.findFirst({
      where: { id, companyId },
    });

    if (!branch) {
      throw new AppError('Branch not found or unauthorized', 404);
    }

    return prisma.branch.update({
      where: { id },
      data,
    });
  }

  async deleteBranch(id: string, companyId: string) {
    const branch = await prisma.branch.findFirst({
      where: { id, companyId },
    });

    if (!branch) {
      throw new AppError('Branch not found or unauthorized', 404);
    }

    return prisma.branch.delete({
      where: { id },
    });
  }

  // Departments CRUD
  async getDepartments(companyId: string) {
    const list = await prisma.department.findMany({
      where: { companyId },
      orderBy: { name: 'asc' },
    });

    // Auto seed default departments if none exist (for premium UX)
    if (list.length === 0) {
      const defaults = [
        'Management', 'Projects', 'Civil', 'Electrical', 
        'Mechanical', 'Purchase', 'Store', 'Accounts', 
        'Quality', 'Safety', 'Administration'
      ];
      await prisma.department.createMany({
        data: defaults.map(name => ({ companyId, name })),
      });
      return prisma.department.findMany({
        where: { companyId },
        orderBy: { name: 'asc' },
      });
    }

    return list;
  }

  async createDepartment(companyId: string, data: { name: string }) {
    const exists = await prisma.department.findFirst({
      where: { companyId, name: { equals: data.name, mode: 'insensitive' } }
    });
    if (exists) {
      throw new AppError('Department already exists', 400);
    }
    return prisma.department.create({
      data: {
        companyId,
        name: data.name,
      },
    });
  }

  async deleteDepartment(id: string, companyId: string) {
    const dep = await prisma.department.findFirst({
      where: { id, companyId },
    });
    if (!dep) {
      throw new AppError('Department not found', 404);
    }
    return prisma.department.delete({
      where: { id },
    });
  }

  // Designations CRUD
  async getDesignations(companyId: string) {
    const list = await prisma.designation.findMany({
      where: { companyId },
      orderBy: { name: 'asc' },
    });

    // Auto seed default designations if none exist
    if (list.length === 0) {
      const defaults = [
        'Project Manager', 'Site Engineer', 'Supervisor', 'Store Keeper',
        'Purchase Officer', 'Accountant', 'Safety Officer', 'Quality Engineer'
      ];
      await prisma.designation.createMany({
        data: defaults.map(name => ({ companyId, name })),
      });
      return prisma.designation.findMany({
        where: { companyId },
        orderBy: { name: 'asc' },
      });
    }

    return list;
  }

  async createDesignation(companyId: string, data: { name: string, permissions?: string[] }) {
    const exists = await prisma.designation.findFirst({
      where: { companyId, name: { equals: data.name, mode: 'insensitive' } }
    });
    if (exists) {
      throw new AppError('Designation already exists', 400);
    }
    return prisma.designation.create({
      data: {
        companyId,
        name: data.name,
        permissions: data.permissions || [],
      },
    });
  }

  async updateDesignation(id: string, companyId: string, data: { name?: string, permissions?: string[] }) {
    const des = await (prisma as any).designation.findFirst({
      where: { id, companyId },
    });
    if (!des) {
      throw new AppError('Designation not found', 404);
    }
    return (prisma as any).designation.update({
      where: { id },
      data: {
        name: data.name ?? des.name,
        permissions: data.permissions ?? (des.permissions || []),
      },
    });
  }

  async deleteDesignation(id: string, companyId: string) {
    const des = await prisma.designation.findFirst({
      where: { id, companyId },
    });
    if (!des) {
      throw new AppError('Designation not found', 404);
    }
    return prisma.designation.delete({
      where: { id },
    });
  }

  // Documents CRUD
  async getDocuments(companyId: string) {
    return prisma.companyDocument.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createDocument(companyId: string, data: any) {
    return prisma.companyDocument.create({
      data: {
        companyId,
        name: data.name,
        type: data.type,
        url: data.url,
        expiryDate: data.expiryDate,
        status: 'ACTIVE',
      },
    });
  }

  async deleteDocument(id: string, companyId: string) {
    const doc = await prisma.companyDocument.findFirst({
      where: { id, companyId },
    });
    if (!doc) {
      throw new AppError('Document not found', 404);
    }
    return prisma.companyDocument.delete({
      where: { id },
    });
  }
}

export const organizationService = new OrganizationService();
