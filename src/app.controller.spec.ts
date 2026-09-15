import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  it('returns the API health message', () => {
    const appController = new AppController(new AppService());

    expect(appController.getHealth()).toBe('Migraine Journal API is running');
  });
});
