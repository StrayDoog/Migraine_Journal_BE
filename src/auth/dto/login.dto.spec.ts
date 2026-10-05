import { loginSchema } from './login.dto';

describe('loginSchema', () => {
  it('normalizes the email address', () => {
    expect(
      loginSchema.parse({
        email: ' PERSON@example.test ',
        password: 'secret',
      }),
    ).toEqual({ email: 'person@example.test', password: 'secret' });
  });

  it('rejects malformed email addresses and empty passwords', () => {
    expect(
      loginSchema.safeParse({ email: 'not-an-email', password: '' }).success,
    ).toBe(false);
  });
});