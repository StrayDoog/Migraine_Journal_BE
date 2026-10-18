import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomBytes } from 'node:crypto';
import * as argon2 from 'argon2';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';

const INVALID_CREDENTIALS_MESSAGE = 'Invalid email or password';
const MILLISECONDS_IN_DAY = 24 * 60 * 60 * 1000;

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  refreshTokenExpiresAt: Date;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async login({ email, password }: LoginDto): Promise<AuthTokens> {
    const user = await this.prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
      select: { id: true, passwordHash: true },
    });

    if (!user?.passwordHash) {
      throw new UnauthorizedException(INVALID_CREDENTIALS_MESSAGE);
    }

    let passwordMatches = false;
    try {
      passwordMatches = await argon2.verify(user.passwordHash, password);
    } catch {
      passwordMatches = false;
    }

    if (!passwordMatches) {
      throw new UnauthorizedException(INVALID_CREDENTIALS_MESSAGE);
    }

    return this.issueTokens(user.id);
  }

  async stayConnected(presentedToken: string | undefined): Promise<AuthTokens> {
    if (!presentedToken) {
      throw new UnauthorizedException();
    }

    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash: this.hashToken(presentedToken) },
    });

    if (
      !stored ||
      stored.revokedAt !== null ||
      stored.expiresAt.getTime() <= Date.now()
    ) {
      throw new UnauthorizedException();
    }

    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    return this.issueTokens(stored.userId);
  }

  private async issueTokens(userId: string): Promise<AuthTokens> {
    const accessToken = await this.jwtService.signAsync({ sub: userId });
    const refreshToken = randomBytes(32).toString('base64url');
    const ttlDays = this.configService.getOrThrow<number>(
      'REFRESH_TOKEN_TTL_DAYS',
    );
    const refreshTokenExpiresAt = new Date(
      Date.now() + ttlDays * MILLISECONDS_IN_DAY,
    );

    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash: this.hashToken(refreshToken),
        expiresAt: refreshTokenExpiresAt,
      },
    });

    return { accessToken, refreshToken, refreshTokenExpiresAt };
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}