import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';

type AuthenticatedRequest = Request & {
  user?: { sub: string };
};

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<AuthenticatedRequest>();
    const token = request.headers.authorization?.match(
      /^Bearer\s+(\S+)$/i,
    )?.[1];

    if (!token) {
      throw new UnauthorizedException();
    }

    try {
      const payload = await this.jwtService.verifyAsync<{ sub?: unknown }>(
        token,
      );

      if (typeof payload.sub !== 'string' || payload.sub.length === 0) {
        throw new UnauthorizedException();
      }

      request.user = { sub: payload.sub };
      return true;
    } catch {
      throw new UnauthorizedException();
    }
  }
}