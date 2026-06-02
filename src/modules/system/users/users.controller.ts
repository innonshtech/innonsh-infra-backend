import { Request, Response, NextFunction } from 'express';
import { UsersService } from './users.service';
import { sendResponse } from '@utils/response.util';
import { createUserSchema, updateUserSchema, assignRoleSchema, toggleStatusSchema } from './users.dto';

export class UsersController {
  private usersService: UsersService;

  constructor() {
    this.usersService = new UsersService();
  }

  getAllUsers = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const users = await this.usersService.getAllUsers(req.user!.company_id);
      sendResponse(res, 200, 'Users fetched successfully', users);
    } catch (error) {
      next(error);
    }
  };

  getUserById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await this.usersService.getUserById(req.params.id as string, req.user!.company_id);
      sendResponse(res, 200, 'User fetched successfully', user);
    } catch (error) {
      next(error);
    }
  };

  createUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = createUserSchema.parse(req.body);
      const user = await this.usersService.createUser(req.user!.company_id, validatedData);
      sendResponse(res, 201, 'User created successfully', user);
    } catch (error) {
      next(error);
    }
  };

  updateUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = updateUserSchema.parse(req.body);
      await this.usersService.updateUser(req.params.id as string, req.user!.company_id, validatedData);
      sendResponse(res, 200, 'User updated successfully');
    } catch (error) {
      next(error);
    }
  };

  deleteUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.usersService.deleteUser(req.params.id as string, req.user!.company_id);
      sendResponse(res, 200, 'User deleted successfully');
    } catch (error) {
      next(error);
    }
  };

  assignRole = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { roleId } = assignRoleSchema.parse(req.body);
      await this.usersService.assignRole(req.params.id as string, req.user!.company_id, roleId);
      sendResponse(res, 200, 'Role assigned successfully');
    } catch (error) {
      next(error);
    }
  };

  toggleStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { isActive } = toggleStatusSchema.parse(req.body);
      await this.usersService.toggleStatus(req.params.id as string, req.user!.company_id, isActive);
      sendResponse(res, 200, `User ${isActive ? 'activated' : 'deactivated'} successfully`);
    } catch (error) {
      next(error);
    }
  };
}
