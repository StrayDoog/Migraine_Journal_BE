import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { AuthService, AuthTokens } from './auth.service';
import { LoginDto, loginSchema } from './dto/login.dto';
import { JwtAuthGuard } from './jwt-auth.guard';

const REFRESH_TOKEN_COOKIE = 'refreshToken';

type AuthenticatedRequest = Request & { user: { sub: string; exp: number } };

@Controller()
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body(new ZodValidationPipe(loginSchema)) loginDto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<{ accessToken: string }> {
    const tokens = await this.authService.login(loginDto);
    return this.respondWithTokens(tokens, response);
  }

  @Post('stay-connected')
  @HttpCode(HttpStatus.OK)
  async stayConnected(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<{ accessToken: string }> {
    const presentedToken = request.cookies?.[REFRESH_TOKEN_COOKIE] as
      | string
      | undefined;
    const tokens = await this.authService.stayConnected(presentedToken);
    return this.respondWithTokens(tokens, response);
  }

  @Get('remaining-time')
  @UseGuards(JwtAuthGuard)
  remainingTime(@Req() request: AuthenticatedRequest): {
    secondsRemaining: number;
  } {
    const nowInSeconds = Math.floor(Date.now() / 1000);
    const secondsRemaining = Math.max(0, request.user.exp - nowInSeconds);
    return { secondsRemaining };
  }

  private respondWithTokens(
    tokens: AuthTokens,
    response: Response,
  ): { accessToken: string } {
    response.cookie(REFRESH_TOKEN_COOKIE, tokens.refreshToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: this.configService.get<string>('NODE_ENV') === 'production',
      path: '/',
      expires: tokens.refreshTokenExpiresAt,
    });
    return { accessToken: tokens.accessToken };
  }
}
