import { Controller, Post, Get, Body, UseGuards, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from './auth.guard';
import { LoginDto } from './dto/login.dto';
import { Request } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto.initData);
  }

  @Post('dev-login')
  devLogin() {
    return this.auth.devLogin();
  }

  @UseGuards(AuthGuard)
  @Get('me')
  me(@Req() req: Request) {
    return this.auth.getProfile((req as any).user.id);
  }
}
