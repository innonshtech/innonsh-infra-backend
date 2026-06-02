import { Request, Response, NextFunction } from 'express';
import { ProjectService } from './project.service';
import { sendResponse } from '../../../utils/response.util';
import { createProjectSchema, updateProjectSchema, addMemberSchema, updateProgressSchema } from './project.dto';

export class ProjectController {
  private projectService: ProjectService;

  constructor() {
    this.projectService = new ProjectService();
  }

  getAllProjects = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const projects = await this.projectService.getAllProjects(req.user!.company_id, req.user);
      sendResponse(res, 200, 'Projects fetched successfully', projects);
    } catch (error) {
      next(error);
    }
  };

  getProjectById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const project = await this.projectService.getProjectById(req.params.id as string, req.user!.company_id, req.user);
      sendResponse(res, 200, 'Project fetched successfully', project);
    } catch (error) {
      next(error);
    }
  };

  createProject = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = createProjectSchema.parse(req.body);
      const project = await this.projectService.createProject(req.user!.company_id, validatedData);
      sendResponse(res, 201, 'Project created successfully', project);
    } catch (error) {
      next(error);
    }
  };

  updateProject = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = updateProjectSchema.parse(req.body);
      await this.projectService.updateProject(req.params.id as string, req.user!.company_id, validatedData);
      sendResponse(res, 200, 'Project updated successfully');
    } catch (error) {
      next(error);
    }
  };

  deleteProject = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.projectService.deleteProject(req.params.id as string, req.user!.company_id);
      sendResponse(res, 200, 'Project deleted successfully');
    } catch (error) {
      next(error);
    }
  };

  addMember = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = addMemberSchema.parse(req.body);
      await this.projectService.addMember(req.params.id as string, req.user!.company_id, validatedData);
      sendResponse(res, 201, 'Member added successfully');
    } catch (error) {
      next(error);
    }
  };

  removeMember = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.projectService.removeMember(
        req.params.id as string,
        req.user!.company_id,
        req.params.userId as string
      );
      sendResponse(res, 200, 'Member removed successfully');
    } catch (error) {
      next(error);
    }
  };

  updateProgress = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = updateProgressSchema.parse(req.body);
      await this.projectService.updateProgress(req.params.id as string, req.user!.company_id, validatedData);
      sendResponse(res, 201, 'Progress updated successfully');
    } catch (error) {
      next(error);
    }
  };

  getProjectProgress = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const progress = await this.projectService.getProjectProgress(req.params.id as string, req.user!.company_id);
      sendResponse(res, 200, 'Progress history fetched successfully', progress);
    } catch (error) {
      next(error);
    }
  };

  getDashboardData = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dashboard = await this.projectService.getDashboardData(req.user!.company_id, req.user);
      sendResponse(res, 200, 'Dashboard data fetched successfully', dashboard);
    } catch (error) {
      next(error);
    }
  };
}
