import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './jwt-strategy'

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'fallbackSecretKeyForDev',
      signOptions: { expiresIn: '1d' },
    }),
  ],
  controllers: [AuthController],
  providers: [JwtStrategy,AuthService]
})
export class AuthModule {}
