import bcrypt from 'bcrypt';
import { UsersRepository } from './users.repository';
import { CreateUserDTO, UpdateUserDTO } from './users.dto';

export class UsersService {
  private usersRepository: UsersRepository;

  constructor() {
    this.usersRepository = new UsersRepository();
  }

  async getAllUsers(companyId: string) {
    return this.usersRepository.findAll(companyId);
  }

  async getUserById(id: string, companyId: string) {
    const user = await this.usersRepository.findById(id, companyId);
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }

  async createUser(companyId: string, data: CreateUserDTO) {
    const existingUser = await this.usersRepository.findByEmail(data.email);
    if (existingUser) {
      throw new Error('Email already in use');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);
    
    return this.usersRepository.create({
      ...data,
      password: hashedPassword,
      companyId,
    });
  }

  async updateUser(id: string, companyId: string, data: UpdateUserDTO) {
    await this.getUserById(id, companyId);
    return this.usersRepository.update(id, companyId, data);
  }

  async deleteUser(id: string, companyId: string) {
    await this.getUserById(id, companyId);
    return this.usersRepository.delete(id, companyId);
  }

  async assignRole(id: string, companyId: string, roleId: string) {
    await this.getUserById(id, companyId);
    return this.usersRepository.updateRole(id, companyId, roleId);
  }

  async toggleStatus(id: string, companyId: string, isActive: boolean) {
    await this.getUserById(id, companyId);
    return this.usersRepository.updateStatus(id, companyId, isActive);
  }
}
