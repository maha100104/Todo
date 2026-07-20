import { Injectable, ConflictException, UnauthorizedException, NotFoundException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { db } from '../db/db';
import { users, todos } from '../schema/schema';
import { eq, desc } from 'drizzle-orm';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) {}

  async register(registerDto: RegisterDto) {
    const { name, email, password } = registerDto;
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email));

    if (existingUser.length > 0) {
      throw new ConflictException('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await db.insert(users).values({
      name,
      email,
      password: hashedPassword,
    });

    return {
      message: 'User registered successfully',
    };
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;
    const usersExist = await db
      .select()
      .from(users)
      .where(eq(users.email, email));

    if (usersExist.length === 0) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const user = usersExist[0];
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = {
      id: user.id,
      email: user.email,
      name: user.name,
    };

    const accessToken = await this.jwtService.signAsync(payload);

    return {
      message: 'Login successful',
      accessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber || null,
      },
    };
  }

  async getProfile(id: number) {
    const userResult = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    if (userResult.length === 0) {
      throw new NotFoundException('User not found');
    }

    const { password, ...sanitizedUser } = userResult[0];

    // Fetch user todos to calculate statistics and recent activity
    const userTodos = await db
      .select()
      .from(todos)
      .where(eq(todos.userId, id))
      .orderBy(desc(todos.updatedAt));

    const todayStr = new Date().toISOString().split('T')[0];

    const stats = {
      total: userTodos.length,
      pending: userTodos.filter((t) => t.status === 'pending').length,
      inProgress: userTodos.filter((t) => t.status === 'in_progress').length,
      completed: userTodos.filter((t) => t.status === 'completed').length,
      overdue: userTodos.filter(
        (t) => t.status !== 'completed' && t.dueDate && t.dueDate < todayStr
      ).length,
    };

    const recentActivities = userTodos.slice(0, 5).map((t) => {
      let action = 'Created';
      if (t.status === 'completed') action = 'Completed';
      else if (t.status === 'in_progress') action = 'Started working on';
      else if (t.createdAt !== t.updatedAt) action = 'Edited';

      return {
        id: t.id,
        text: `${action} "${t.title}"`,
        time: t.updatedAt || t.createdAt,
      };
    });

    return {
      message: 'Profile retrieved successfully',
      user: sanitizedUser,
      stats,
      recentActivities,
    };
  }

  async updateProfile(id: number, updateProfileDto: UpdateProfileDto) {
    const userExist = await db.select().from(users).where(eq(users.id, id));
    if (userExist.length === 0) {
      throw new NotFoundException('User not found');
    }

    await db
      .update(users)
      .set({
        ...updateProfileDto,
      })
      .where(eq(users.id, id));

    const updatedUser = await db.select().from(users).where(eq(users.id, id));
    const { password, ...sanitizedUser } = updatedUser[0];

    return {
      message: 'Profile updated successfully',
      user: sanitizedUser,
    };
  }

  async changePassword(id: number, changePasswordDto: ChangePasswordDto) {
    const userExist = await db.select().from(users).where(eq(users.id, id));
    if (userExist.length === 0) {
      throw new NotFoundException('User not found');
    }

    const user = userExist[0];
    const isPasswordValid = await bcrypt.compare(
      changePasswordDto.currentPassword,
      user.password
    );

    if (!isPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    if (changePasswordDto.currentPassword === changePasswordDto.newPassword) {
      throw new BadRequestException('New password and current password cannot be the same');
    }

    const hashedPassword = await bcrypt.hash(changePasswordDto.newPassword, 10);

    await db
      .update(users)
      .set({ password: hashedPassword })
      .where(eq(users.id, id));

    return {
      message: 'Password changed successfully',
    };
  }
}
