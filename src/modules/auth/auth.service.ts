import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { AppError } from '../../middleware/error.middleware';
import { generateToken, generateRefreshToken, verifyRefreshToken } from '../../utils/jwt.util';
import { authRepository } from './auth.repository';
import { 
  RegisterInput, 
  RegisterSuperadminInput,
  LoginInput, 
  RefreshTokenInput, 
  ForgotPasswordInput, 
  ResetPasswordInput 
} from './auth.dto';

export class AuthService {
  async register(data: RegisterInput) {
    const existingUser = await authRepository.findUserByEmail(data.email);
    if (existingUser) {
      throw new AppError('Email already in use', 400);
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const { user, company } = await authRepository.createCompanyWithAdmin(
      { name: data.companyName, erpType: data.erpType },
      { 
        email: data.email, 
        password: hashedPassword, 
        firstName: data.firstName, 
        lastName: data.lastName 
      },
      { name: 'SuperAdmin', permissions: ['*'] }
    );

    const tokenPayload = this.createTokenPayload(user);
    const accessToken = generateToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    await authRepository.updateUser(user.id, { refreshToken });

    return {
      accessToken,
      refreshToken,
      user: this.sanitizeUser(user),
      company
    };
  }

  async registerSuperadmin(data: RegisterSuperadminInput) {
    const existingSuperAdmin = await authRepository.findSuperAdmin();
    if (existingSuperAdmin) {
      throw new AppError('A Superadmin account already exists.', 403);
    }

    const existingUser = await authRepository.findUserByEmail(data.email);
    if (existingUser) {
      throw new AppError('Email already in use', 400);
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const { user } = await authRepository.createIndependentSuperadmin(
      { 
        email: data.email, 
        password: hashedPassword, 
        firstName: data.firstName, 
        lastName: data.lastName 
      },
      { name: 'SUPERADMIN', permissions: ['*'] }
    );

    const tokenPayload = this.createTokenPayload(user);
    const accessToken = generateToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    await authRepository.updateUser(user.id, { refreshToken });

    return {
      accessToken,
      refreshToken,
      user: this.sanitizeUser(user)
    };
  }

  async login(data: LoginInput) {
    const user = await authRepository.findUserByEmail(data.email);
    if (!user || !(await bcrypt.compare(data.password, user.password))) {
      throw new AppError('Invalid email or password', 401);
    }

    if (!user.isActive) {
      throw new AppError('Account is deactivated', 403);
    }

    const tokenPayload = this.createTokenPayload(user);
    const accessToken = generateToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    await authRepository.updateUser(user.id, { refreshToken });

    return {
      accessToken,
      refreshToken,
      user: this.sanitizeUser(user)
    };
  }

  async logout(userId: string) {
    await authRepository.updateUser(userId, { refreshToken: null });
  }

  async refresh(data: RefreshTokenInput) {
    try {
      const decoded = verifyRefreshToken(data.refreshToken) as any;
      const user = await authRepository.findUserByRefreshToken(data.refreshToken);

      if (!user || user.id !== decoded.id) {
        throw new AppError('Invalid refresh token', 401);
      }

      const tokenPayload = this.createTokenPayload(user);
      const accessToken = generateToken(tokenPayload);
      const newRefreshToken = generateRefreshToken(tokenPayload);

      await authRepository.updateUser(user.id, { refreshToken: newRefreshToken });

      return {
        accessToken,
        refreshToken: newRefreshToken
      };
    } catch (error) {
      throw new AppError('Session expired. Please login again.', 401);
    }
  }

  async forgotPassword(data: ForgotPasswordInput) {
    const user = await authRepository.findUserByEmail(data.email);
    if (!user) {
      // Don't leak user existence in production, but for ERP we might be more specific or generic
      throw new AppError('If an account with that email exists, a reset link has been sent.', 200);
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    const resetPasswordExpire = new Date(Date.now() + 30 * 60 * 1000); // 30 mins

    await authRepository.updateUser(user.id, {
      resetPasswordToken,
      resetPasswordExpire
    });

    // In a real app, send email here. Returning token for demonstration.
    return { resetToken }; 
  }

  async resetPassword(data: ResetPasswordInput) {
    const resetPasswordToken = crypto.createHash('sha256').update(data.token).digest('hex');
    const user = await authRepository.findUserByResetToken(resetPasswordToken);

    if (!user) {
      throw new AppError('Invalid or expired reset token', 400);
    }

    const hashedPassword = await bcrypt.hash(data.newPassword, 10);
    await authRepository.updateUser(user.id, {
      password: hashedPassword,
      resetPasswordToken: null,
      resetPasswordExpire: null,
      refreshToken: null // Force logout from all sessions after password change
    });
  }

  private createTokenPayload(user: any) {
    return {
      id: user.id,
      email: user.email,
      company_id: user.companyId || null,
      erpType: user.company?.erpType || 'PLATFORM_OWNER',
      role: user.role?.name || 'USER',
      permissions: Array.from(new Set([...(user.permissions || []), ...(user.role?.permissions || [])]))
    };
  }

  private sanitizeUser(user: any) {
    const { password, refreshToken, resetPasswordToken, resetPasswordExpire, ...sanitized } = user;
    return sanitized;
  }
}

export const authService = new AuthService();
