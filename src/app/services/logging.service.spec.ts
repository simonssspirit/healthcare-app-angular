import { TestBed } from '@angular/core/testing';
import { LoggingService } from './logging.service';

describe('LoggingService', () => {
  let service: LoggingService;
  let consoleWarnSpy: jasmine.Spy;
  let consoleErrorSpy: jasmine.Spy;
  let consoleInfoSpy: jasmine.Spy;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LoggingService);
    consoleWarnSpy = spyOn(console, 'warn');
    consoleErrorSpy = spyOn(console, 'error');
    consoleInfoSpy = spyOn(console, 'info');
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('warn', () => {
    it('should call console.warn with message only', () => {
      service.warn('Test warning message');
      expect(consoleWarnSpy).toHaveBeenCalledWith('Test warning message');
    });

    it('should call console.warn with message and context', () => {
      const context = { key: 'value' };
      service.warn('Test warning with context', context);
      expect(consoleWarnSpy).toHaveBeenCalledWith('Test warning with context', context);
    });
  });

  describe('error', () => {
    it('should call console.error with message only', () => {
      service.error('Test error message');
      expect(consoleErrorSpy).toHaveBeenCalledWith('Test error message');
    });

    it('should call console.error with message and context', () => {
      const context = { error: 'details' };
      service.error('Test error with context', context);
      expect(consoleErrorSpy).toHaveBeenCalledWith('Test error with context', context);
    });
  });

  describe('info', () => {
    it('should call console.info with message only', () => {
      service.info('Test info message');
      expect(consoleInfoSpy).toHaveBeenCalledWith('Test info message');
    });

    it('should call console.info with message and context', () => {
      const context = { info: 'details' };
      service.info('Test info with context', context);
      expect(consoleInfoSpy).toHaveBeenCalledWith('Test info with context', context);
    });
  });
});
