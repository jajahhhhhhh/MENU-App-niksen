/**
 * SQLite-backed session store for express-session.
 *
 * Replaces the default MemoryStore, which warns on every production boot that
 * it "will leak memory, and will not scale past a single process". Two things
 * that actually bit us: every deploy or restart logged the counter staff out of
 * the POS, and the leak grows for as long as the process stays up.
 *
 * Written against the existing better-sqlite3 connection rather than pulling in
 * a package: the Store interface is four methods, `better-sqlite3-session-store`
 * has been untouched since 2022 at v0.1.0, and `connect-sqlite3` would add a
 * second native SQLite driver alongside the one we already compile.
 */
import { Store, type SessionData } from "express-session";
import type BetterSqlite3 from "better-sqlite3";

/** Fallback lifetime when the cookie carries no expiry of its own. */
const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000;
/** How often to sweep rows that are already past their expiry. */
const SWEEP_INTERVAL_MS = 60 * 60 * 1000;

export class SqliteSessionStore extends Store {
  private db: BetterSqlite3.Database;
  private sweepTimer: NodeJS.Timeout;

  constructor(db: BetterSqlite3.Database) {
    super();
    this.db = db;

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS sessions (
        sid     TEXT PRIMARY KEY,
        expires INTEGER NOT NULL,
        data    TEXT NOT NULL
      )
    `);
    // Sweeping is a range scan over expires; without this it is a table scan.
    this.db.exec('CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires)');

    this.sweep();
    this.sweepTimer = setInterval(() => this.sweep(), SWEEP_INTERVAL_MS);
    // Don't hold the event loop open just for the sweep — the process should
    // still exit cleanly on SIGTERM during a deploy.
    this.sweepTimer.unref();
  }

  /** Delete rows that have already expired. */
  private sweep(): void {
    try {
      this.db.prepare('DELETE FROM sessions WHERE expires <= ?').run(Date.now());
    } catch {
      // A failed sweep is not worth taking the server down for — the rows are
      // still filtered out on read, so this is housekeeping, not correctness.
    }
  }

  private expiryOf(sess: SessionData): number {
    const expires = sess?.cookie?.expires;
    if (expires) return new Date(expires).getTime();
    const maxAge = sess?.cookie?.maxAge;
    if (typeof maxAge === 'number') return Date.now() + maxAge;
    return Date.now() + DEFAULT_TTL_MS;
  }

  get(sid: string, cb: (err?: any, session?: SessionData | null) => void): void {
    try {
      const row = this.db
        .prepare('SELECT data, expires FROM sessions WHERE sid = ?')
        .get(sid) as { data: string; expires: number } | undefined;

      if (!row) return cb(null, null);
      // Expired but not yet swept: treat as absent and drop it now.
      if (row.expires <= Date.now()) {
        this.db.prepare('DELETE FROM sessions WHERE sid = ?').run(sid);
        return cb(null, null);
      }
      cb(null, JSON.parse(row.data));
    } catch (err) {
      // A row we can't parse is a dead session, not a server fault — report it
      // as "no session" so the caller is asked to log in again.
      cb(null, null);
    }
  }

  set(sid: string, sess: SessionData, cb?: (err?: any) => void): void {
    try {
      this.db
        .prepare('INSERT INTO sessions (sid, expires, data) VALUES (?, ?, ?) ' +
                 'ON CONFLICT(sid) DO UPDATE SET expires = excluded.expires, data = excluded.data')
        .run(sid, this.expiryOf(sess), JSON.stringify(sess));
      cb?.();
    } catch (err) {
      cb?.(err);
    }
  }

  destroy(sid: string, cb?: (err?: any) => void): void {
    try {
      this.db.prepare('DELETE FROM sessions WHERE sid = ?').run(sid);
      cb?.();
    } catch (err) {
      cb?.(err);
    }
  }

  /**
   * Extend a session's life without rewriting its payload. express-session
   * calls this on every request for an unmodified session, so it must stay
   * cheap — a rolling window costs one indexed UPDATE.
   */
  touch(sid: string, sess: SessionData, cb?: (err?: any) => void): void {
    try {
      this.db
        .prepare('UPDATE sessions SET expires = ? WHERE sid = ?')
        .run(this.expiryOf(sess), sid);
      cb?.();
    } catch (err) {
      cb?.(err);
    }
  }

  /** Count of live sessions. Used by express-session tooling, handy for checks. */
  length(cb: (err: any, length?: number) => void): void {
    try {
      const row = this.db
        .prepare('SELECT COUNT(*) AS n FROM sessions WHERE expires > ?')
        .get(Date.now()) as { n: number };
      cb(null, row.n);
    } catch (err) {
      cb(err);
    }
  }

  /** Drop every session — logs everyone out. */
  clear(cb?: (err?: any) => void): void {
    try {
      this.db.exec('DELETE FROM sessions');
      cb?.();
    } catch (err) {
      cb?.(err);
    }
  }
}
