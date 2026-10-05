import { UnauthorizedException } from '@nestjs/common';
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

  beforeAll(async () => {
    passwordHash = await argon2.hash(password);
  });

  beforeEach(() => {
    findUnique = jest.fn<(args: unknown) => Promise<unknown>>();
    signAsync = jest
      .fn<(payload: unknown) => Promise<string>>()
      .mockResolvedValue('signed-access-token');

    const prisma = {
      user: { findUnique },
    } as unknown as PrismaService;
    const jwtService = { signAsync } as unknown as JwtService;

    service = new AuthService(prisma, jwtService);
  });

  it('returns an access token for valid credentials', async () => {
    findUnique.mockResolvedValue({ id: 'user-1', passwordHash });

    await expect(
      service.login({ email: ' PERSON@example.test ', password }),
    ).resolves.toEqual({ accessToken: 'signed-access-token' });

    expect(findUnique).toHaveBeenCalledWith({
      where: { email: 'person@example.test' },
      select: { id: true, passwordHash: true },
    });
    expect(signAsync).toHaveBeenCalledWith({ sub: 'user-1' });
  });

  it('rejects an incorrect password with a generic unauthorized response', async () => {
    findUnique.mockResolvedValue({ id: 'user-1', passwordHash });

    await expect(
      service.login({ email: 'person@example.test', password: 'wrong' }),
    ).rejects.toThrow(new UnauthorizedException('Invalid email or password'));
    expect(signAsync).not.toHaveBeenCalled();
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
});