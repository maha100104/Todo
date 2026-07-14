import { Injectable, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt'
import { LoginDto } from './dto/login.dto'
import { UnauthorizedException, NotFoundException } from '@nestjs/common'
import { RegisterDto } from './dto/register.dto'
import { db } from '../db/db'
import { users, logins, orders } from '../schema/user.schema';
import { eq, sql, desc, and, or, like, asc } from "drizzle-orm"
import bcrypt from "bcrypt";

@Injectable()
export class AuthService {
    constructor(
        private readonly jwtService: JwtService
    ) { }
    async login(loginDto: LoginDto) {
        const { email, password } = loginDto
        const usersExist = await db
            .select()
            .from(users)
            .where(eq(users.email, email))

        if (usersExist.length === 0) {
            throw new UnauthorizedException("Invalid Credentials")
        }
        const user = usersExist[0]
        const isPasswordValid = await bcrypt.compare(password, user.password)
        if (!isPasswordValid) {
            throw new UnauthorizedException("Invalid Credentials")
        }
        const payload = {
            id: user.id,
            email: user.email,
            role: user.role
        }

        // Generate access token (expires in 15m) and refresh token (expires in 7d)
        const accessToken = await this.jwtService.signAsync(payload, {
            expiresIn: '1h'
        })
        const refreshToken = await this.jwtService.signAsync(payload, {
            expiresIn: '7d'
        })

        // Upsert into logins table
        const existingLogin = await db
            .select()
            .from(logins)
            .where(eq(logins.id, user.id))

        if (existingLogin.length > 0) {
            await db.update(logins)
                .set({ accessToken, refreshToken })
                .where(eq(logins.id, user.id))
        } else {
            await db.insert(logins).values({
                id: user.id,
                accessToken,
                refreshToken
            })
        }

        return {
            message: "login Successfully",
            accessToken,
            refreshToken
        }
    }
    async register(registerDto: RegisterDto) {
        const { name, email, password } = registerDto
        const existingUser = await db
            .select()
            .from(users)
            .where(eq(users.email, email))

        if (existingUser.length > 0) {
            throw new ConflictException("Email already exist")
        }

        const hashedPassword = await bcrypt.hash(password, 10)
        await db.insert(users).values({
            name: name,
            email: email,
            password: hashedPassword,
            role: "user"
        })
        return {
            message: "User Registered Successfully"
        }
    }
    async getProfile(id: number) {
        const user = await db
            .select()
            .from(users)
            .where(eq(users.id, id))
            .limit(1)

        if (user.length === 0) {
            throw new NotFoundException("User not found")
        }
        const { password, ...sanitizedUser } = user[0];
        return {
            message: "Profile found successfully",
            user: sanitizedUser
        }
    }
    async refresh(refreshToken: string) {
        try {
            const payload = await this.jwtService.verifyAsync(refreshToken);
            const session = await db
                .select()
                .from(logins)
                .where(eq(logins.refreshToken, refreshToken));

            if (session.length === 0) {
                throw new UnauthorizedException("Invalid refresh token");
            }

            const userPayload = { id: payload.id, email: payload.email, role: payload.role };
            const newAccessToken = await this.jwtService.signAsync(userPayload, {
                expiresIn: '1h'
            });
            const newRefreshToken = await this.jwtService.signAsync(userPayload, {
                expiresIn: '7d'
            });

            await db.update(logins)
                .set({ accessToken: newAccessToken, refreshToken: newRefreshToken })
                .where(eq(logins.id, session[0].id));

            return {
                accessToken: newAccessToken,
                refreshToken: newRefreshToken,

            };
        } catch (error) {
            console.log(error)
            throw new UnauthorizedException("Token refresh failed");
        }
    }
    async logout(id: number) {
        await db
            .update(logins)
            .set({
                logOutAt: new Date()
            })
            .where(eq(logins.id, id))
        return {
            message: "logout successfully"
        }
    }
    async updateProfile(userId: number, body: any) {
        const userExist = await db
            .select()
            .from(users)
            .where(eq(users.id, userId))
            .limit(1);

        if (userExist.length === 0) {
            throw new NotFoundException('User not found');
        }
        const user = userExist[0];
        const updates: any = {};

        // 1. Update Name
        if (body.name && body.name.trim() !== '') {
            updates.name = body.name.trim();
        }

        // 2. Update Password
        if (body.oldPassword || body.newPassword) {
            if (!body.oldPassword || !body.newPassword) {
                throw new UnauthorizedException('Both old password and new password are required to change password');
            }

            // Check if new password is same as old password
            if (body.oldPassword === body.newPassword) {
                throw new UnauthorizedException('New password cannot be the same as the old password');
            }

            // Validate old password
            const isPasswordValid = await bcrypt.compare(body.oldPassword, user.password);
            if (!isPasswordValid) {
                throw new UnauthorizedException('Invalid old password');
            }

            // Encrypt new password
            updates.password = await bcrypt.hash(body.newPassword, 10);
        }

        // Perform DB update if there are changes
        if (Object.keys(updates).length > 0) {
            await db.update(users)
                .set(updates)
                .where(eq(users.id, userId));
        }

        // Fetch the updated user profile
        const updatedUser = await db
            .select()
            .from(users)
            .where(eq(users.id, userId))
            .limit(1);

        const { password, ...sanitizedUser } = updatedUser[0];

        return {
            message: 'Profile updated successfully',
            user: sanitizedUser
        };
    }

    async adminGetUsers(query: { search?: string; role?: string; sortBy?: string }) {
        const conditions: any[] = [];

        if (query.role && query.role !== 'all') {
            conditions.push(eq(users.role, query.role));
        }

        if (query.search) {
            const searchPattern = `%${query.search}%`;
            conditions.push(
                or(
                    like(users.name, searchPattern),
                    like(users.email, searchPattern)
                )
            );
        }

        const baseQuery = db
            .select({
                id: users.id,
                name: users.name,
                email: users.email,
                role: users.role,
                createdAt: users.createdAt,
                lastUsedDate: sql<string>`COALESCE(${logins.loginAt}, ${users.createdAt})`,
                orderCount: sql<number>`count(${orders.id})`
            })
            .from(users)
            .leftJoin(logins, eq(users.id, logins.id))
            .leftJoin(orders, eq(users.id, orders.userId));

        if (conditions.length > 0) {
            baseQuery.where(and(...conditions));
        }

        baseQuery.groupBy(users.id);

        const sortBy = query.sortBy || 'newest';
        if (sortBy === 'newest') {
            baseQuery.orderBy(desc(users.createdAt));
        } else if (sortBy === 'oldest') {
            baseQuery.orderBy(asc(users.createdAt));
        } else if (sortBy === 'orders-desc') {
            baseQuery.orderBy(desc(sql`count(${orders.id})`));
        } else if (sortBy === 'orders-asc') {
            baseQuery.orderBy(asc(sql`count(${orders.id})`));
        } else if (sortBy === 'name-az') {
            baseQuery.orderBy(asc(users.name));
        } else if (sortBy === 'name-za') {
            baseQuery.orderBy(desc(users.name));
        }

        return baseQuery;
    }
}
