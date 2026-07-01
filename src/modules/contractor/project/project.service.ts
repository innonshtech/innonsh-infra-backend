import { ProjectRepository } from './project.repository';
import { CreateProjectDTO, UpdateProjectDTO, AddMemberDTO, UpdateProgressDTO } from './project.dto';

export class ProjectService {
  private projectRepository: ProjectRepository;

  constructor() {
    this.projectRepository = new ProjectRepository();
  }

  async getAllProjects(companyId: string, user?: any) {
    return this.projectRepository.findAll(companyId, user);
  }

  async getProjectById(id: string, companyId: string, user?: any) {
    const project = await this.projectRepository.findById(id, companyId, user);
    if (!project) {
      throw new Error('Project not found');
    }
    return project;
  }

  async createProject(companyId: string, data: CreateProjectDTO) {
    return this.projectRepository.create({
      ...data,
      companyId,
    });
  }

  async updateProject(id: string, companyId: string, data: UpdateProjectDTO) {
    await this.getProjectById(id, companyId);
    return this.projectRepository.update(id, companyId, data);
  }

  async deleteProject(id: string, companyId: string) {
    await this.getProjectById(id, companyId);
    return this.projectRepository.delete(id, companyId);
  }

  async addMember(id: string, companyId: string, data: AddMemberDTO) {
    await this.getProjectById(id, companyId);
    return this.projectRepository.addMember(id, data);
  }

  async removeMember(id: string, companyId: string, userId: string) {
    await this.getProjectById(id, companyId);
    return this.projectRepository.removeMember(id, userId);
  }

  async updateProgress(id: string, companyId: string, data: UpdateProgressDTO) {
    await this.getProjectById(id, companyId);
    return this.projectRepository.addProgress(id, data);
  }

  async getProjectProgress(id: string, companyId: string) {
    await this.getProjectById(id, companyId);
    return this.projectRepository.getProgress(id);
  }

  async getDashboardData(companyId: string, user?: any) {
    const stats = await this.projectRepository.getStats(companyId, user);
    const recentProjects = await this.projectRepository.findAll(companyId, user);

    return {
      stats,
      recentProjects: recentProjects.slice(0, 5),
    };
  }

  // --- Project Planning Service Methods ---
  async getPlanning(projectId: string, companyId: string) {
    await this.getProjectById(projectId, companyId);
    const planning = await this.projectRepository.findPlanning(projectId, companyId);
    if (!planning) {
      throw new Error('Project planning details not found');
    }
    return planning;
  }

  async syncProjectPlanningAggregates(projectId: string, companyId: string) {
    const planning = await this.projectRepository.findPlanning(projectId, companyId);
    if (!planning) return;

    const phases = planning.phases || [];
    const runningPhase = phases.find((p: any) => p.status === 'RUNNING');

    let currentPhase = 'Not Started';
    if (runningPhase) {
      currentPhase = runningPhase.name;
    } else {
      const allCompleted = phases.length > 0 && phases.every((p: any) => p.status === 'COMPLETED');
      if (allCompleted) {
        currentPhase = 'Completed';
      }
    }

    let delayDays = 0;
    const today = new Date();
    today.setHours(0,0,0,0);

    if (runningPhase && runningPhase.endDate) {
      const phaseEnd = new Date(runningPhase.endDate);
      phaseEnd.setHours(0,0,0,0);
      if (today > phaseEnd) {
        const diffTime = today.getTime() - phaseEnd.getTime();
        delayDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      }
    } else if (planning.plannedEndDate) {
      const projectEnd = new Date(planning.plannedEndDate);
      projectEnd.setHours(0,0,0,0);
      if (today > projectEnd) {
        const diffTime = today.getTime() - projectEnd.getTime();
        delayDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      }
    }

    await this.projectRepository.updatePlanning(projectId, companyId, {
      currentPhase,
      delayDays,
    });
  }

  async updatePlanning(projectId: string, companyId: string, data: any) {
    await this.getProjectById(projectId, companyId);
    const result = await this.projectRepository.updatePlanning(projectId, companyId, data);
    await this.syncProjectPlanningAggregates(projectId, companyId);
    return result;
  }

  // --- Phases CRUD ---
  async createPhase(projectId: string, companyId: string, data: any) {
    await this.getProjectById(projectId, companyId);
    const result = await this.projectRepository.createPhase(projectId, data);
    await this.syncProjectPlanningAggregates(projectId, companyId);
    return result;
  }

  async updatePhase(phaseId: string, projectId: string, companyId: string, data: any) {
    await this.getProjectById(projectId, companyId);
    const result = await this.projectRepository.updatePhase(phaseId, projectId, data);
    await this.syncProjectPlanningAggregates(projectId, companyId);
    return result;
  }

  async deletePhase(phaseId: string, projectId: string, companyId: string) {
    await this.getProjectById(projectId, companyId);
    const result = await this.projectRepository.deletePhase(phaseId, projectId);
    await this.syncProjectPlanningAggregates(projectId, companyId);
    return result;
  }

  // --- Milestones CRUD ---
  async createMilestone(projectId: string, companyId: string, data: any) {
    await this.getProjectById(projectId, companyId);
    return this.projectRepository.createMilestone(projectId, data);
  }

  async updateMilestone(milestoneId: string, projectId: string, companyId: string, data: any) {
    await this.getProjectById(projectId, companyId);
    return this.projectRepository.updateMilestone(milestoneId, projectId, data);
  }

  async deleteMilestone(milestoneId: string, projectId: string, companyId: string) {
    await this.getProjectById(projectId, companyId);
    return this.projectRepository.deleteMilestone(milestoneId, projectId);
  }

  // --- Resource Plans CRUD ---
  async createResourcePlan(projectId: string, companyId: string, data: any) {
    await this.getProjectById(projectId, companyId);
    return this.projectRepository.createResourcePlan(projectId, data);
  }

  async updateResourcePlan(resourcePlanId: string, projectId: string, companyId: string, data: any) {
    await this.getProjectById(projectId, companyId);
    return this.projectRepository.updateResourcePlan(resourcePlanId, projectId, data);
  }

  async deleteResourcePlan(resourcePlanId: string, projectId: string, companyId: string) {
    await this.getProjectById(projectId, companyId);
    return this.projectRepository.deleteResourcePlan(resourcePlanId, projectId);
  }

  // --- Risks CRUD ---
  async createRisk(projectId: string, companyId: string, data: any) {
    await this.getProjectById(projectId, companyId);
    return this.projectRepository.createRisk(projectId, data);
  }

  async updateRisk(riskId: string, projectId: string, companyId: string, data: any) {
    await this.getProjectById(projectId, companyId);
    return this.projectRepository.updateRisk(riskId, projectId, data);
  }

  async deleteRisk(riskId: string, projectId: string, companyId: string) {
    await this.getProjectById(projectId, companyId);
    return this.projectRepository.deleteRisk(riskId, projectId);
  }
}
