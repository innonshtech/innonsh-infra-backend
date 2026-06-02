import { prisma } from '@config/prisma.config';
import { CreateTaskDTO, UpdateTaskDTO } from './task.dto';

interface TaskWithSubtasks {
  id: string;
  name: string;
  description: string | null;
  wbsCode: string | null;
  startDate: Date | null;
  endDate: Date | null;
  progress: number;
  weightage: number;
  status: string;
  projectId: string;
  parentId: string | null;
  subTasks?: TaskWithSubtasks[];
  _count?: {
    subTasks: number;
  };
}

export class TaskService {
  async getTasksByProject(projectId: string): Promise<TaskWithSubtasks[]> {
    const tasks = await (prisma as any).projectTask.findMany({
      where: { projectId },
      orderBy: { wbsCode: 'asc' },
      include: {
        _count: {
          select: { subTasks: true },
        },
      },
    });

    return this.buildTaskTree(tasks);
  }

  private buildTaskTree(tasks: any[], parentId: string | null = null): TaskWithSubtasks[] {
    return tasks
      .filter((task) => task.parentId === parentId)
      .map((task) => ({
        ...task,
        subTasks: this.buildTaskTree(tasks, task.id),
      }));
  }

  async createTask(projectId: string, data: CreateTaskDTO) {
    return (prisma as any).projectTask.create({
      data: {
        ...data,
        projectId,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
      },
    });
  }

  async updateTask(id: string, data: UpdateTaskDTO) {
    const updateData: any = { ...data };
    if (data.startDate) updateData.startDate = new Date(data.startDate);
    if (data.endDate) updateData.endDate = new Date(data.endDate);

    const updatedTask = await (prisma as any).projectTask.update({
      where: { id },
      data: updateData,
    });

    // --- Automated Milestone Handshake ---
    if (updatedTask.isMilestone && updatedTask.progress >= (updatedTask.milestoneTriggerValue || 100)) {
      await this.triggerPaymentMilestones(updatedTask.id);
    }

    if (updatedTask.parentId && (data.progress !== undefined || data.weightage !== undefined)) {
      await this.recalculateParentProgress(updatedTask.parentId);
    }

    return updatedTask;
  }

  private async triggerPaymentMilestones(taskId: string) {
    // 1. Find all payment milestones linked to this construction task
    const milestones = await (prisma as any).paymentMilestone.findMany({
      where: { taskId, isTriggered: false }
    });

    if (milestones.length === 0) return;

    // 2. Trigger them (Update status to INVOICED or READY)
    await (prisma as any).paymentMilestone.updateMany({
      where: { taskId, isTriggered: false },
      data: {
        isTriggered: true,
        triggeredAt: new Date(),
        status: 'INVOICED' // In a real system, you'd trigger a PDF generation job here
      }
    });
    
    // In a real system, you'd also send notifications here
    console.log(`[AUTOMATION] Generated ${milestones.length} invoices for Milestone Task ${taskId}`);
  }

  async deleteTask(id: string) {
    const task = await (prisma as any).projectTask.findUnique({ where: { id } });
    const result = await (prisma as any).projectTask.delete({ where: { id } });
    
    if (task?.parentId) {
      await this.recalculateParentProgress(task.parentId);
    }
    
    return result;
  }

  private async recalculateParentProgress(parentId: string) {
    const siblings = await (prisma as any).projectTask.findMany({
      where: { parentId },
    });

    if (siblings.length === 0) return;

    const totalWeightage = siblings.reduce((sum: number, s: any) => sum + (s.weightage || 0), 0);
    let parentProgress = 0;

    if (totalWeightage > 0) {
      parentProgress = siblings.reduce((sum: number, s: any) => {
        return sum + (s.progress * (s.weightage / totalWeightage));
      }, 0);
    } else {
      parentProgress = siblings.reduce((sum: number, s: any) => sum + s.progress, 0) / siblings.length;
    }

    const parent = await (prisma as any).projectTask.update({
      where: { id: parentId },
      data: { progress: Math.round(parentProgress * 100) / 100 },
    });

    if (parent.parentId) {
      await this.recalculateParentProgress(parent.parentId);
    } else {
      await this.updateProjectProgress(parent.projectId);
    }
  }

  private async updateProjectProgress(projectId: string) {
    const topLevelTasks = await (prisma as any).projectTask.findMany({
      where: { projectId, parentId: null },
    });

    if (topLevelTasks.length === 0) return;

    const totalWeightage = topLevelTasks.reduce((sum: number, t: any) => sum + (t.weightage || 0), 0);
    let projectProgress = 0;

    if (totalWeightage > 0) {
      projectProgress = topLevelTasks.reduce((sum: number, t: any) => {
        return sum + (t.progress * (t.weightage / totalWeightage));
      }, 0);
    } else {
      projectProgress = topLevelTasks.reduce((sum: number, t: any) => sum + t.progress, 0) / topLevelTasks.length;
    }

    await prisma.projectProgress.create({
      data: {
        projectId,
        percentage: Math.round(projectProgress * 100) / 100,
        statusUpdate: 'Automatic update from WBS tasks',
      }
    });
  }
}
