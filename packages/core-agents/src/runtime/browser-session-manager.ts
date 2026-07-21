/**
 * Browser Session Manager — Lifecycle, pooling, and resource management
 *
 * Manages:
 * - Browser instance pooling (max concurrent browsers)
 * - Session tracking by ID + context
 * - Auto-cleanup and TTL enforcement
 * - Memory limits per browser
 */

import type { Browser, Page } from 'playwright';

export interface BrowserSessionHandle {
  id: string;
  browser?: Browser;
  page?: Page;
  createdAt: Date;
  lastAccessAt: Date;
  status: 'active' | 'closing' | 'closed';
  memoryUsageBytes: number;
}

export interface BrowserSessionOptions {
  maxConcurrent?: number;
  sessionTTLMs?: number;
  maxMemoryPerBrowserMb?: number;
  headless?: boolean;
}

export class BrowserSessionManager {
  private sessions = new Map<string, BrowserSessionHandle>();
  private readonly options: Required<BrowserSessionOptions>;
  private cleanupInterval?: NodeJS.Timeout;

  constructor(options: BrowserSessionOptions = {}) {
    this.options = {
      maxConcurrent: options.maxConcurrent ?? 3,
      sessionTTLMs: options.sessionTTLMs ?? 5 * 60 * 1000, // 5 min
      maxMemoryPerBrowserMb: options.maxMemoryPerBrowserMb ?? 256,
      headless: options.headless ?? true,
    };

    // Auto-cleanup every 30s
    this.cleanupInterval = setInterval(() => this.cleanup(), 30000);
  }

  async createSession(sessionId: string): Promise<BrowserSessionHandle> {
    // Check pool size
    const activeSessions = Array.from(this.sessions.values()).filter(
      s => s.status === 'active'
    );

    if (activeSessions.length >= this.options.maxConcurrent) {
      // Close oldest least-recently-used session
      const oldest = activeSessions.sort(
        (a, b) => a.lastAccessAt.getTime() - b.lastAccessAt.getTime()
      )[0];
      await this.closeSession(oldest.id);
    }

    const handle: BrowserSessionHandle = {
      id: sessionId,
      createdAt: new Date(),
      lastAccessAt: new Date(),
      status: 'active',
      memoryUsageBytes: 0,
    };

    this.sessions.set(sessionId, handle);
    return handle;
  }

  getSession(sessionId: string): BrowserSessionHandle | undefined {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.lastAccessAt = new Date();
    }
    return session;
  }

  async closeSession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    session.status = 'closing';

    try {
      if (session.page) {
        await session.page.close().catch(() => {});
      }
      if (session.browser) {
        await session.browser.close().catch(() => {});
      }
    } catch (err) {
      // Swallow close errors
    }

    session.status = 'closed';
    this.sessions.delete(sessionId);
  }

  private cleanup(): void {
    const now = new Date();
    const expired: string[] = [];

    for (const [id, session] of this.sessions.entries()) {
      const age = now.getTime() - session.lastAccessAt.getTime();
      if (age > this.options.sessionTTLMs && session.status === 'active') {
        expired.push(id);
      }
    }

    for (const id of expired) {
      this.closeSession(id).catch(() => {});
    }
  }

  async destroyAll(): Promise<void> {
    clearInterval(this.cleanupInterval);

    const ids = Array.from(this.sessions.keys());
    for (const id of ids) {
      await this.closeSession(id);
    }
  }

  getActiveSessions(): BrowserSessionHandle[] {
    return Array.from(this.sessions.values()).filter(s => s.status === 'active');
  }
}
