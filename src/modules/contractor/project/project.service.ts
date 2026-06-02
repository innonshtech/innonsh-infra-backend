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
}
