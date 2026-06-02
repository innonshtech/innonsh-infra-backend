import { prisma } from '../../../config/prisma.config';
import { CreateProjectDTO, UpdateProjectDTO, AddMemberDTO, UpdateProgressDTO } from './project.dto';

export class ProjectRepository {
  private getProjectWhereClause(companyId: string, user?: any) {
    if (!user) return { companyId };
    
    const hasFullAccess = user.permissions?.includes('*') || user.permissions?.includes('projects.manage');
    if (hasFullAccess) {
      return { companyId };
    }
    
    return {
      companyId,
      members: {
        some: {
          userId: user.id
        }
      }
    };
  }

  async findAll(companyId: string, user?: any) {
    return prisma.project.findMany({
      where: this.getProjectWhereClause(companyId, user),
      include: {
        _count: {
          select: { members: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string, companyId: string, user?: any) {
    return (prisma.project as any).findFirst({
      where: { id, ...this.getProjectWhereClause(companyId, user) },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        progressUpdates: {
          orderBy: { updatedAt: 'desc' },
          take: 10,
        },
        tasks: {
          where: { parentId: null },
          include: {
            subTasks: true,
          },
        },
        workers: {
          orderBy: { createdAt: 'desc' },
        },
        equipment: {
          orderBy: { createdAt: 'desc' },
        },
        invoices: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
        procurementRequests: {
          orderBy: { createdAt: 'desc' },
          take: 20,
          include: {
            items: true,
            purchaseOrders: true,
          },
        },
      },
    });
  }

  async create(data: CreateProjectDTO & { companyId: string }) {
    return (prisma.project as any).create({
      data,
    });
  }

  async update(id: string, companyId: string, data: UpdateProjectDTO) {
    return prisma.project.updateMany({
      where: { id, companyId },
      data,
    });
  }

  async delete(id: string, companyId: string) {
    return prisma.project.deleteMany({
      where: { id, companyId },
    });
  }

  async addMember(projectId: string, data: AddMemberDTO) {
    return prisma.projectMember.create({
      data: {
        projectId,
        userId: data.userId,
        role: data.role,
      },
    });
  }

  async removeMember(projectId: string, userId: string) {
    return prisma.projectMember.delete({
      where: {
        projectId_userId: {
          projectId,
          userId,
        },
      },
    });
  }

  async addProgress(projectId: string, data: UpdateProgressDTO) {
    return prisma.projectProgress.create({
      data: {
        projectId,
        percentage: data.percentage,
        statusUpdate: data.statusUpdate,
      },
    });
  }

  async getProgress(projectId: string) {
    return prisma.projectProgress.findMany({
      where: { projectId },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async getStats(companyId: string, user?: any) {
    const whereClause = this.getProjectWhereClause(companyId, user);
    
    const [totalProjects, activeProjects, completedProjects] = await Promise.all([
      prisma.project.count({ where: whereClause }),
      prisma.project.count({ where: { ...whereClause, status: 'IN_PROGRESS' } }),
      prisma.project.count({ where: { ...whereClause, status: 'COMPLETED' } }),
    ]);

    return {
      totalProjects,
      activeProjects,
      completedProjects,
    };
  }
}
