// Single place to open the DB and ensure schema (better-sqlite3)
import path from 'node:path';
import fs from 'node:fs';
import Database from 'better-sqlite3';
import type { Database as DBType } from 'better-sqlite3';
import { app } from 'electron';

let db: DBType | null = null;

export function getDb(): DBType {
    if (db) return db;

    const dir = app.getPath('userData');
    const file = path.join(dir, 'app.db');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    db = new Database(file);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');

    initSchema(db);
    return db;
}

function initSchema(db: DBType) {
    // Ensure your repository tables exist here, once
    db.prepare(`
    CREATE TABLE IF NOT EXISTS clipboardHistories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        content TEXT NOT NULL,
        copyTime TEXT NOT NULL
    )`).run();

    db.prepare(`
    CREATE INDEX IF NOT EXISTS idx_clipboard_copyTime ON clipboardHistories(copyTime)
    `).run();

    db.prepare(`
    CREATE INDEX IF NOT EXISTS idx_clipboard_copytime_id ON clipboardHistories(copyTime DESC, id DESC)
    `).run();
}
