import { Request, Response, NextFunction } from 'express';
import { ProjectService } from './project.service';
import { sendResponse } from '../../../utils/response.util';
import { 
  createProjectSchema, 
  updateProjectSchema, 
  addMemberSchema, 
  updateProgressSchema,
  updatePlanningSchema,
  createPhaseSchema,
  createMilestoneSchema,
  createResourcePlanSchema,
  createRiskSchema
} from './project.dto';

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

  // --- Project Planning Endpoints ---
  getPlanning = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const planning = await this.projectService.getPlanning(req.params.projectId as string, req.user!.company_id);
      sendResponse(res, 200, 'Planning details fetched successfully', planning);
    } catch (error) {
      next(error);
    }
  };

  updatePlanning = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = updatePlanningSchema.parse(req.body);
      await this.projectService.updatePlanning(req.params.projectId as string, req.user!.company_id, validatedData);
      sendResponse(res, 200, 'Planning details updated successfully');
    } catch (error) {
      next(error);
    }
  };

  // --- Phases ---
  createPhase = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = createPhaseSchema.parse(req.body);
      const phase = await this.projectService.createPhase(req.params.projectId as string, req.user!.company_id, validatedData);
      sendResponse(res, 201, 'Phase created successfully', phase);
    } catch (error) {
      next(error);
    }
  };

  updatePhase = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = createPhaseSchema.partial().parse(req.body);
      await this.projectService.updatePhase(req.params.id as string, req.params.projectId as string, req.user!.company_id, validatedData);
      sendResponse(res, 200, 'Phase updated successfully');
    } catch (error) {
      next(error);
    }
  };

  deletePhase = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.projectService.deletePhase(req.params.id as string, req.params.projectId as string, req.user!.company_id);
      sendResponse(res, 200, 'Phase deleted successfully');
    } catch (error) {
      next(error);
    }
  };

  // --- Milestones ---
  createMilestone = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = createMilestoneSchema.parse(req.body);
      const milestone = await this.projectService.createMilestone(req.params.projectId as string, req.user!.company_id, validatedData);
      sendResponse(res, 201, 'Milestone created successfully', milestone);
    } catch (error) {
      next(error);
    }
  };

  updateMilestone = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = createMilestoneSchema.partial().parse(req.body);
      await this.projectService.updateMilestone(req.params.id as string, req.params.projectId as string, req.user!.company_id, validatedData);
      sendResponse(res, 200, 'Milestone updated successfully');
    } catch (error) {
      next(error);
    }
  };

  deleteMilestone = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.projectService.deleteMilestone(req.params.id as string, req.params.projectId as string, req.user!.company_id);
      sendResponse(res, 200, 'Milestone deleted successfully');
    } catch (error) {
      next(error);
    }
  };

  // --- Resource Plans ---
  createResourcePlan = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = createResourcePlanSchema.parse(req.body);
      const resourcePlan = await this.projectService.createResourcePlan(req.params.projectId as string, req.user!.company_id, validatedData);
      sendResponse(res, 201, 'Resource plan created successfully', resourcePlan);
    } catch (error) {
      next(error);
    }
  };

  updateResourcePlan = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = createResourcePlanSchema.partial().parse(req.body);
      await this.projectService.updateResourcePlan(req.params.id as string, req.params.projectId as string, req.user!.company_id, validatedData);
      sendResponse(res, 200, 'Resource plan updated successfully');
    } catch (error) {
      next(error);
    }
  };

  deleteResourcePlan = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.projectService.deleteResourcePlan(req.params.id as string, req.params.projectId as string, req.user!.company_id);
      sendResponse(res, 200, 'Resource plan deleted successfully');
    } catch (error) {
      next(error);
    }
  };

  // --- Risks ---
  createRisk = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = createRiskSchema.parse(req.body);
      const risk = await this.projectService.createRisk(req.params.projectId as string, req.user!.company_id, validatedData);
      sendResponse(res, 201, 'Risk created successfully', risk);
    } catch (error) {
      next(error);
    }
  };

  updateRisk = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = createRiskSchema.partial().parse(req.body);
      await this.projectService.updateRisk(req.params.id as string, req.params.projectId as string, req.user!.company_id, validatedData);
      sendResponse(res, 200, 'Risk updated successfully');
    } catch (error) {
      next(error);
    }
  };

  deleteRisk = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.projectService.deleteRisk(req.params.id as string, req.params.projectId as string, req.user!.company_id);
      sendResponse(res, 200, 'Risk deleted successfully');
    } catch (error) {
      next(error);
    }
  };
}
