import { Injectable, isDevMode } from '@angular/core';

/**
 * Centralized logging service that respects environment configuration.
 * In development, logs to console. In production, can be extended to send to monitoring services.
 */
@Injectable({
  providedIn: 'root'
})
export class LoggingService {
  private readonly isDevelopment = isDevMode();

  /**
   * Logs a warning message. Only outputs to console in development mode.
   * @param message - The warning message to log
   * @param context - Optional context object for additional information
   */
  warn(message: string, context?: any): void {
    if (this.isDevelopment) {
      if (context) {
        console.warn(message, context);
      } else {
        console.warn(message);
      }
    }
  }

  /**
   * Logs an error message. Outputs to console in development mode.
   * In production, this could be extended to send errors to a monitoring service.
   * @param message - The error message to log
   * @param context - Optional context object for additional information
   */
  error(message: string, context?: any): void {
    if (this.isDevelopment) {
      if (context) {
        console.error(message, context);
      } else {
        console.error(message);
      }
    }
    // TODO: In production, send to error tracking service (e.g., Sentry, Application Insights)
  }

  /**
   * Logs an informational message. Only outputs to console in development mode.
   * @param message - The info message to log
   * @param context - Optional context object for additional information
   */
  info(message: string, context?: any): void {
    if (this.isDevelopment) {
      if (context) {
        console.info(message, context);
      } else {
        console.info(message);
      }
    }
  }
}
