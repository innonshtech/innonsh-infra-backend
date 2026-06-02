import { Request, Response, NextFunction } from 'express';
import { BuilderProjectService } from './project.service';
import { TaskService } from '../../contractor/project/task.service';
import { sendResponse } from '@utils/response.util';
import { 
  createBuilderProjectSchema, 
  updateBuilderProjectSchema 
} from './project.dto';
import { 
  createUnitSchema, 
  createBookingSchema, 
  createLeadSchema,
  updateLeadSchema
} from './builder.dto';
import { createTaskSchema, updateTaskSchema } from '../../contractor/project/task.dto';

export class BuilderProjectController {
  private service: BuilderProjectService;
  private taskService: TaskService;

  constructor() {
    this.service = new BuilderProjectService();
    this.taskService = new TaskService();
  }

  getAllProjects = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.getAllProjects(req.user!.company_id);
      sendResponse(res, 200, 'Projects fetched successfully', data);
    } catch (error) {
      next(error);
    }
  };

  getProjectById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.getProjectById(req.params.id as string, req.user!.company_id);
      sendResponse(res, 200, 'Project details fetched successfully', data);
    } catch (error) {
      next(error);
    }
  };

  createProject = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = createBuilderProjectSchema.parse(req.body);
      const data = await this.service.createProject(req.user!.company_id, validatedData);
      sendResponse(res, 201, 'Project created successfully', data);
    } catch (error) {
      next(error);
    }
  };

  updateProject = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = updateBuilderProjectSchema.parse(req.body);
      await this.service.updateProject(req.params.id as string, req.user!.company_id, validatedData);
      sendResponse(res, 200, 'Project updated successfully');
    } catch (error) {
      next(error);
    }
  };

  deleteProject = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.service.deleteProject(req.params.id as string, req.user!.company_id);
      sendResponse(res, 200, 'Project deleted successfully');
    } catch (error) {
      next(error);
    }
  };

  getDashboard = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.getProjectDashboard(req.params.id as string, req.user!.company_id);
      sendResponse(res, 200, 'Project dashboard data fetched successfully', data);
    } catch (error) {
      next(error);
    }
  };

  getUnits = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.getProjectUnits(req.params.id as string, req.user!.company_id);
      sendResponse(res, 200, 'Project units fetched successfully', data);
    } catch (error) {
      next(error);
    }
  };

  getBookings = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.getProjectBookings(req.params.id as string, req.user!.company_id);
      sendResponse(res, 200, 'Project bookings fetched successfully', data);
    } catch (error) {
      next(error);
    }
  };

  createUnit = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = createUnitSchema.parse(req.body);
      const data = await (this.service as any).repository.createUnit(req.user!.company_id, validatedData);
      sendResponse(res, 201, 'Unit created successfully', data);
    } catch (error) {
      next(error);
    }
  };

  createBooking = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = createBookingSchema.parse(req.body);
      const data = await (this.service as any).repository.createBooking(req.user!.company_id, validatedData);
      sendResponse(res, 201, 'Booking confirmed', data);
    } catch (error) {
      next(error);
    }
  };

  getLeads = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const projectId = req.query.projectId as string || undefined;
      const data = await (this.service as any).repository.getLeads(req.user!.company_id, projectId);
      sendResponse(res, 200, 'Leads fetched successfully', data);
    } catch (error) {
      next(error);
    }
  };

  createLead = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = createLeadSchema.parse(req.body);
      const data = await (this.service as any).repository.createLead(req.user!.company_id, validatedData);
      sendResponse(res, 201, 'Lead added to CRM', data);
    } catch (error) {
      next(error);
    }
  };

  // --- Isolated Builder Construction Tasks ---

  getTasks = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tasks = await this.taskService.getTasksByProject(req.params.id as string);
      sendResponse(res, 200, 'Project WBS fetched successfully', tasks);
    } catch (error) {
      next(error);
    }
  };

  createTask = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = createTaskSchema.parse(req.body);
      const task = await this.taskService.createTask(req.params.id as string, validatedData);
      sendResponse(res, 201, 'Building task created', task);
    } catch (error) {
      next(error);
    }
  };

  updateTask = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = updateTaskSchema.parse(req.body);
      const task = await this.taskService.updateTask(req.params.taskId as string, validatedData);
      sendResponse(res, 200, 'Task updated in Builder WBS', task);
    } catch (error) {
      next(error);
    }
  };

  deleteTask = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.taskService.deleteTask(req.params.taskId as string);
      sendResponse(res, 200, 'Task removed from builder flow');
    } catch (error) {
      next(error);
    }
  };
}
