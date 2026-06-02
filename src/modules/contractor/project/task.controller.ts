import { Request, Response, NextFunction } from 'express';
import { TaskService } from './task.service';
import { sendResponse } from '@utils/response.util';
import { createTaskSchema, updateTaskSchema } from './task.dto';

export class TaskController {
  private taskService = new TaskService();

  getTasks = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tasks = await this.taskService.getTasksByProject(req.params.projectId as string);
      sendResponse(res, 200, 'Tasks fetched successfully', tasks);
    } catch (error) {
      next(error);
    }
  };

  createTask = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = createTaskSchema.parse(req.body);
      const task = await this.taskService.createTask(req.params.projectId as string, validatedData);
      sendResponse(res, 201, 'Task created successfully', task);
    } catch (error) {
      next(error);
    }
  };

  updateTask = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = updateTaskSchema.parse(req.body);
      const task = await this.taskService.updateTask(req.params.id as string, validatedData);
      sendResponse(res, 200, 'Task updated successfully', task);
    } catch (error) {
      next(error);
    }
  };

  deleteTask = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.taskService.deleteTask(req.params.id as string);
      sendResponse(res, 200, 'Task deleted successfully');
    } catch (error) {
      next(error);
    }
  };
}
