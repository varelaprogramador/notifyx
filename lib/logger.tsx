// Simple logger with different log levels

type LogLevel = "debug" | "info" | "warn" | "error";

class Logger {
  private level: LogLevel = "info";

  constructor() {
    // Set log level from environment variable if available
    if (process.env.DEBUG === "true") {
      this.level = "debug";
    }
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: Record<LogLevel, number> = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3,
    };

    return levels[level] >= levels[this.level];
  }

  debug(message: string, ...args: any[]): void {
    if (this.shouldLog("debug")) {
      console.log(`[DEBUG] ${message}`, ...args);
    }
  }

  info(message: string, ...args: any[]): void {
    if (this.shouldLog("info")) {
      console.log(`[INFO] ${message}`, ...args);
    }
  }

  warn(message: string, ...args: any[]): void {
    if (this.shouldLog("warn")) {
      console.warn(`[WARN] ${message}`, ...args);
    }
  }

  error(message: string, ...args: any[]): void {
    if (this.shouldLog("error")) {
      console.error(`[ERROR] ${message}`, ...args);
    }
  }
}

export const logger = new Logger();
