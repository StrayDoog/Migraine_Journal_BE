import {
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { jest } from '@jest/globals';
import type { Request } from 'express';
import { JwtAuthGuard } from './jwt-auth.guard';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let verifyAsync: jest.Mock<(token: string) => Promise<unknown>>;

  beforeEach(() => {
    verifyAsync = jest.fn<(token: string) => Promise<unknown>>();
    guard = new JwtAuthGuard({ verifyAsync } as unknown as JwtService);
  });

  function createContext(authorization?: string): {
    context: ExecutionContext;
    request: Request & { user?: { sub: string } };
  } {
    const request = {
      headers: { authorization },
    } as Request & { user?: { sub: string } };
    const context = {
      switchToHttp: () => ({ getRequest: () => request }),
    } as ExecutionContext;

    return { context, request };
  }

  it('accepts a valid bearer token and attaches its subject to the request', async () => {
    verifyAsync.mockResolvedValue({ sub: 'user-1' });
    const { context, request } = createContext('Bearer valid-token');

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(verifyAsync).toHaveBeenCalledWith('valid-token');
    expect(request.user).toEqual({ sub: 'user-1' });
  });

  it('rejects a request without a bearer token', async () => {
    const { context } = createContext();

    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
    expect(verifyAsync).not.toHaveBeenCalled();
  });

  it('rejects an invalid token or a token without a subject', async () => {
    const { context: invalidTokenContext } = createContext('Bearer invalid');
    verifyAsync.mockRejectedValue(new Error('Invalid token'));

    await expect(guard.canActivate(invalidTokenContext)).rejects.toThrow(
      UnauthorizedException,
    );

    verifyAsync.mockResolvedValue({});
    const { context: missingSubjectContext } = createContext('Bearer token');

    await expect(guard.canActivate(missingSubjectContext)).rejects.toThrow(
      UnauthorizedException,
    );
  });
});