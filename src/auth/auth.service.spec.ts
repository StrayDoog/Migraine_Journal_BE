import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { jest } from '@jest/globals';
import * as argon2 from 'argon2';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  const password = 'CorrectHorseBatteryStaple!';
  let passwordHash: string;
  let service: AuthService;
  let findUnique: jest.Mock<(args: unknown) => Promise<unknown>>;
  let signAsync: jest.Mock<(payload: unknown) => Promise<string>>;
  let refreshCreate: jest.Mock<(args: unknown) => Promise<unknown>>;
  let refreshFindUnique: jest.Mock<(args: unknown) => Promise<unknown>>;
  let refreshUpdate: jest.Mock<(args: unknown) => Promise<unknown>>;

  beforeAll(async () => {
    passwordHash = await argon2.hash(password);
  });

  beforeEach(() => {
    findUnique = jest.fn<(args: unknown) => Promise<unknown>>();
    signAsync = jest
      .fn<(payload: unknown) => Promise<string>>()
      .mockResolvedValue('signed-access-token');
    refreshCreate = jest
      .fn<(args: unknown) => Promise<unknown>>()
      .mockResolvedValue({});
    refreshFindUnique = jest.fn<(args: unknown) => Promise<unknown>>();
    refreshUpdate = jest
      .fn<(args: unknown) => Promise<unknown>>()
      .mockResolvedValue({});

    const prisma = {
      user: { findUnique },
      refreshToken: {
        create: refreshCreate,
        findUnique: refreshFindUnique,
        update: refreshUpdate,
      },
    } as unknown as PrismaService;
    const jwtService = { signAsync } as unknown as JwtService;
    const configService = {
      getOrThrow: jest.fn(() => 7),
      get: jest.fn(() => 'test'),
    } as unknown as ConfigService;

    service = new AuthService(prisma, jwtService, configService);
  });

  it('returns tokens and persists a refresh token for valid credentials', async () => {
    findUnique.mockResolvedValue({ id: 'user-1', passwordHash });

    const tokens = await service.login({
      email: ' PERSON@example.test ',
      password,
    });

    expect(tokens.accessToken).toBe('signed-access-token');
    expect(typeof tokens.refreshToken).toBe('string');
    expect(tokens.refreshToken.length).toBeGreaterThan(0);
    expect(tokens.refreshTokenExpiresAt).toBeInstanceOf(Date);
    expect(findUnique).toHaveBeenCalledWith({
      where: { email: 'person@example.test' },
      select: { id: true, passwordHash: true },
    });
    expect(signAsync).toHaveBeenCalledWith({ sub: 'user-1' });
    expect(refreshCreate).toHaveBeenCalledWith({
      data: {
        userId: 'user-1',
        tokenHash: expect.any(String),
        expiresAt: expect.any(Date),
      },
    });
  });

  it('rejects an incorrect password with a generic unauthorized response', async () => {
    findUnique.mockResolvedValue({ id: 'user-1', passwordHash });

    await expect(
      service.login({ email: 'person@example.test', password: 'wrong' }),
    ).rejects.toThrow(new UnauthorizedException('Invalid email or password'));
    expect(signAsync).not.toHaveBeenCalled();
    expect(refreshCreate).not.toHaveBeenCalled();
  });

  it('rejects an unknown email with the same unauthorized response', async () => {
    findUnique.mockResolvedValue(null);

    await expect(
      service.login({ email: 'unknown@example.test', password }),
    ).rejects.toThrow(new UnauthorizedException('Invalid email or password'));
  });

  it('rejects users without a password hash', async () => {
    findUnique.mockResolvedValue({ id: 'user-1', passwordHash: null });

    await expect(
      service.login({ email: 'person@example.test', password }),
    ).rejects.toThrow(new UnauthorizedException('Invalid email or password'));
  });

  it('rotates the refresh token and issues new tokens on stay-connected', async () => {
    refreshFindUnique.mockResolvedValue({
      id: 'refresh-1',
      userId: 'user-1',
      revokedAt: null,
      expiresAt: new Date(Date.now() + 60_000),
    });

    const tokens = await service.stayConnected('presented-token');

    expect(tokens.accessToken).toBe('signed-access-token');
    expect(typeof tokens.refreshToken).toBe('string');
    expect(refreshUpdate).toHaveBeenCalledWith({
      where: { id: 'refresh-1' },
      data: { revokedAt: expect.any(Date) },
    });
    expect(signAsync).toHaveBeenCalledWith({ sub: 'user-1' });
    expect(refreshCreate).toHaveBeenCalled();
  });

  it('rejects a missing refresh token', async () => {
    await expect(service.stayConnected(undefined)).rejects.toThrow(
      UnauthorizedException,
    );
    expect(refreshFindUnique).not.toHaveBeenCalled();
  });

  it('rejects an unknown refresh token', async () => {
    refreshFindUnique.mockResolvedValue(null);

    await expect(service.stayConnected('presented-token')).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('rejects a revoked refresh token', async () => {
    refreshFindUnique.mockResolvedValue({
      id: 'refresh-1',
      userId: 'user-1',
      revokedAt: new Date(),
      expiresAt: new Date(Date.now() + 60_000),
    });

    await expect(service.stayConnected('presented-token')).rejects.toThrow(
      UnauthorizedException,
    );
    expect(refreshUpdate).not.toHaveBeenCalled();
  });

  it('rejects an expired refresh token', async () => {
    refreshFindUnique.mockResolvedValue({
      id: 'refresh-1',
      userId: 'user-1',
      revokedAt: null,
      expiresAt: new Date(Date.now() - 60_000),
    });

    await expect(service.stayConnected('presented-token')).rejects.toThrow(
      UnauthorizedException,
    );
    expect(refreshUpdate).not.toHaveBeenCalled();
  });
});