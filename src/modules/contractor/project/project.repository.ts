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
        progressUpdates: {
          orderBy: { updatedAt: 'desc' },
          take: 1,
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

  // --- Project Planning Repository Methods ---
  async findPlanning(projectId: string, companyId: string) {
    return (prisma.project as any).findFirst({
      where: { id: projectId, companyId },
      select: {
        id: true,
        name: true,
        plannedStartDate: true,
        plannedEndDate: true,
        currentPhase: true,
        delayDays: true,
        planningNotes: true,
        phases: {
          orderBy: { createdAt: 'asc' }
        },
        milestones: {
          orderBy: { targetDate: 'asc' }
        },
        resourcePlans: {
          orderBy: { createdAt: 'asc' }
        },
        risks: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });
  }

  async updatePlanning(projectId: string, companyId: string, data: any) {
    return prisma.project.updateMany({
      where: { id: projectId, companyId },
      data: {
        plannedStartDate: data.plannedStartDate ? new Date(data.plannedStartDate) : undefined,
        plannedEndDate: data.plannedEndDate ? new Date(data.plannedEndDate) : undefined,
        currentPhase: data.currentPhase !== undefined ? data.currentPhase : undefined,
        delayDays: data.delayDays !== undefined ? data.delayDays : undefined,
        planningNotes: data.planningNotes !== undefined ? data.planningNotes : undefined,
      }
    });
  }

  // --- Phases ---
  async createPhase(projectId: string, data: any) {
    return prisma.projectPhase.create({
      data: {
        projectId,
        name: data.name,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
        isStarted: data.isStarted ?? false,
        isCompleted: data.isCompleted ?? false,
        progress: data.progress ?? 0,
        status: data.status ?? 'PENDING',
      }
    });
  }

  async updatePhase(phaseId: string, projectId: string, data: any) {
    return prisma.projectPhase.updateMany({
      where: { id: phaseId, projectId },
      data: {
        name: data.name,
        startDate: data.startDate !== undefined ? (data.startDate ? new Date(data.startDate) : null) : undefined,
        endDate: data.endDate !== undefined ? (data.endDate ? new Date(data.endDate) : null) : undefined,
        isStarted: data.isStarted,
        isCompleted: data.isCompleted,
        progress: data.progress,
        status: data.status,
      }
    });
  }

  async deletePhase(phaseId: string, projectId: string) {
    return prisma.projectPhase.deleteMany({
      where: { id: phaseId, projectId }
    });
  }

  // --- Milestones ---
  async createMilestone(projectId: string, data: any) {
    return prisma.projectMilestone.create({
      data: {
        projectId,
        name: data.name,
        targetDate: new Date(data.targetDate),
        isCompleted: data.isCompleted ?? false,
      }
    });
  }

  async updateMilestone(milestoneId: string, projectId: string, data: any) {
    return prisma.projectMilestone.updateMany({
      where: { id: milestoneId, projectId },
      data: {
        name: data.name,
        targetDate: data.targetDate ? new Date(data.targetDate) : undefined,
        isCompleted: data.isCompleted,
      }
    });
  }

  async deleteMilestone(milestoneId: string, projectId: string) {
    return prisma.projectMilestone.deleteMany({
      where: { id: milestoneId, projectId }
    });
  }

  // --- Resource Plans ---
  async createResourcePlan(projectId: string, data: any) {
    return prisma.projectResourcePlan.create({
      data: {
        projectId,
        phaseId: data.phaseId || null,
        category: data.category,
        name: data.name,
        quantity: data.quantity,
        unit: data.unit,
      }
    });
  }

  async updateResourcePlan(resourcePlanId: string, projectId: string, data: any) {
    return prisma.projectResourcePlan.updateMany({
      where: { id: resourcePlanId, projectId },
      data: {
        phaseId: data.phaseId !== undefined ? (data.phaseId || null) : undefined,
        category: data.category,
        name: data.name,
        quantity: data.quantity,
        unit: data.unit,
      }
    });
  }

  async deleteResourcePlan(resourcePlanId: string, projectId: string) {
    return prisma.projectResourcePlan.deleteMany({
      where: { id: resourcePlanId, projectId }
    });
  }

  // --- Risks ---
  async createRisk(projectId: string, data: any) {
    return prisma.projectRisk.create({
      data: {
        projectId,
        name: data.name,
        priority: data.priority,
        status: data.status ?? 'OPEN',
      }
    });
  }

  async updateRisk(riskId: string, projectId: string, data: any) {
    return prisma.projectRisk.updateMany({
      where: { id: riskId, projectId },
      data: {
        name: data.name,
        priority: data.priority,
        status: data.status,
      }
    });
  }

  async deleteRisk(riskId: string, projectId: string) {
    return prisma.projectRisk.deleteMany({
      where: { id: riskId, projectId }
    });
  }
}
