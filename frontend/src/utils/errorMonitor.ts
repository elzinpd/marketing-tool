/**
 * Error monitoring utility that captures console errors and logs them
 * for easier debugging with VS Code integration.
 */

class ErrorMonitor {
  private originalConsoleError: typeof console.error;
  private originalConsoleWarn: typeof console.warn;
  private originalWindowOnError: OnErrorEventHandler;
  private originalWindowOnUnhandledRejection: ((event: PromiseRejectionEvent) => void) | null;
  private errors: Array<{ type: string; message: string; timestamp: Date; stack?: string }> = [];

  constructor() {
    // Store original console methods
    this.originalConsoleError = console.error;
    this.originalConsoleWarn = console.warn;
    this.originalWindowOnError = window.onerror;
    this.originalWindowOnUnhandledRejection = null;

    // Initialize
    this.setupErrorHandlers();
  }

  /**
   * Set up all error handlers
   */
  private setupErrorHandlers(): void {
    // Override console.error
    console.error = (...args: any[]) => {
      this.captureError('console.error', args);
      this.originalConsoleError.apply(console, args);
    };

    // Override console.warn
    console.warn = (...args: any[]) => {
      this.captureError('console.warn', args);
      this.originalConsoleWarn.apply(console, args);
    };

    // Handle window.onerror
    window.onerror = (message, source, lineno, colno, error) => {
      this.captureError('window.onerror', [message], error?.stack);
      
      // Call original handler if it exists
      if (this.originalWindowOnError) {
        return this.originalWindowOnError(message, source, lineno, colno, error);
      }
      return false;
    };

    // Handle unhandled promise rejections
    this.originalWindowOnUnhandledRejection = window.onunhandledrejection;
    window.onunhandledrejection = (event: PromiseRejectionEvent) => {
      this.captureError(
        'unhandledRejection', 
        [event.reason?.message || 'Unhandled Promise Rejection'],
        event.reason?.stack
      );
      
      // Call original handler if it exists
      if (this.originalWindowOnUnhandledRejection) {
        this.originalWindowOnUnhandledRejection(event);
      }
    };
  }

  /**
   * Capture an error and add it to the errors array
   */
  private captureError(type: string, args: any[], stack?: string): void {
    const message = args.map(arg => {
      if (arg instanceof Error) {
        return `${arg.name}: ${arg.message}\n${arg.stack || ''}`;
      } else if (typeof arg === 'object') {
        try {
          return JSON.stringify(arg, null, 2);
        } catch (e) {
          return String(arg);
        }
      } else {
        return String(arg);
      }
    }).join(' ');

    this.errors.push({
      type,
      message,
      timestamp: new Date(),
      stack
    });

    // Add a special marker for VS Code debugging
    if (type === 'console.error') {
      // This will be highlighted in VS Code's debug console
      console.debug('%c VS Code Error Monitor: Error captured', 'background: #ff0000; color: white; padding: 2px 5px; border-radius: 3px;');
    }
  }

  /**
   * Get all captured errors
   */
  public getErrors(): Array<{ type: string; message: string; timestamp: Date; stack?: string }> {
    return this.errors;
  }

  /**
   * Clear all captured errors
   */
  public clearErrors(): void {
    this.errors = [];
  }

  /**
   * Restore original console methods
   */
  public restore(): void {
    console.error = this.originalConsoleError;
    console.warn = this.originalConsoleWarn;
    window.onerror = this.originalWindowOnError;
    window.onunhandledrejection = this.originalWindowOnUnhandledRejection;
  }
}

// Create and export a singleton instance
const errorMonitor = new ErrorMonitor();
export default errorMonitor;
