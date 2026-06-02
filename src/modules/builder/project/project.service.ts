import { BuilderProjectRepository } from './project.repository';
import { CreateBuilderProjectDTO, UpdateBuilderProjectDTO } from './project.dto';

export class BuilderProjectService {
  private repository: BuilderProjectRepository;

  constructor() {
    this.repository = new BuilderProjectRepository();
  }

  async getAllProjects(companyId: string) {
    return this.repository.findAll(companyId);
  }

  async getProjectById(id: string, companyId: string) {
    const project = await this.repository.findById(id, companyId);
    if (!project) throw new Error('Project not found');
    return project;
  }

  async createProject(companyId: string, data: CreateBuilderProjectDTO) {
    return this.repository.create({ ...data, companyId });
  }

  async updateProject(id: string, companyId: string, data: UpdateBuilderProjectDTO) {
    return this.repository.update(id, companyId, data);
  }

  async deleteProject(id: string, companyId: string) {
    return this.repository.delete(id, companyId);
  }

  async getProjectUnits(id: string, companyId: string) {
    await this.getProjectById(id, companyId);
    return this.repository.getUnits(id, companyId);
  }

  async getProjectBookings(id: string, companyId: string) {
    await this.getProjectById(id, companyId);
    return this.repository.getBookings(id, companyId);
  }

  async getProjectDashboard(id: string, companyId: string) {
    await this.getProjectById(id, companyId);
    return this.repository.getDashboardStats(id, companyId);
  }
}
