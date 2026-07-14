import { Controller, Post, Body, Get, Put, UseGuards, Req, ForbiddenException, Query } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshDto } from './dto/refresh.dto';
import { JwtAuthGuard } from '../guard/jwt-auth-guard';
import { GetUser } from '../customDecorator/getProfile';

@Controller('auth')
export class AuthController {
    constructor(
        private readonly authService:AuthService
    ){}

    @Post('login')
    login(@Body() loginDto:LoginDto){
        return this.authService.login(loginDto)
    }

    @Post('register')
    register(@Body() registerDto:RegisterDto){
        return this.authService.register(registerDto)
    }

    @Get('profile')
    @UseGuards(JwtAuthGuard)
    getProfile(@GetUser() user ){
        return this.authService.getProfile(user.id)
    }

    @Put('profile')
    @UseGuards(JwtAuthGuard)
    updateProfile(@GetUser() user, @Body() body: any) {
        return this.authService.updateProfile(user.id, body);
    }

    @Post('refresh')
    refresh(@Body() refreshDto: RefreshDto) {
        return this.authService.refresh(refreshDto.refreshToken);
    }

    @Post('logout')
    @UseGuards(JwtAuthGuard)
    logOut(@GetUser() user) {
        return this.authService.logout(user.id)
    }

    @Get('admin/users')
    @UseGuards(JwtAuthGuard)
    adminGetUsers(
        @GetUser() user,
        @Query('search') search?: string,
        @Query('role') role?: string,
        @Query('sortBy') sortBy?: string
    ) {
        if (user.role !== 'admin') {
            throw new ForbiddenException('Only admin can access this resource.');
        }
        return this.authService.adminGetUsers({ search, role, sortBy });
    }
}
