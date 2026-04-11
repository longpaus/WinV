import { CopyItem } from "../types/clipboard";
import IClipboardRepository from "./IClipboardRepository";
import type { Database as DBType } from "better-sqlite3"
import { getDb } from '../db'
import { getConfig } from '../config'
class ClipboardRepository implements IClipboardRepository {
    db: DBType;
    constructor() {
        this.db = getDb();
    }
    getClipBoardHistory(limit: number): CopyItem[] {
        try {
            const clipboardHistory: CopyItem[] = this.db.prepare(`select * from clipboardHistories order by copyTime desc limit ${limit}`).all() as CopyItem[];
            return clipboardHistory;
        } catch (error) {
            throw new Error(`Error getting clipboard history: ${error}`);
        }
    }
    addToClipBoardHistory(content: string): CopyItem {
        try {
            const now = new Date().toISOString();
            const result = this.db.prepare('insert into clipboardHistories (content, copyTime) values (?,?)').run(content, now);
            this.trimOlderThanMaxAge();
            return { id: Number(result.lastInsertRowid), content, copyTime: now }
        } catch (error) {
            throw new Error(`Error getting clipboard history: ${error}`);
        }
    }

    private trimOlderThanMaxAge(): void {
        const { maxHistoryDays } = getConfig();
        const cutoff = new Date(Date.now() - maxHistoryDays * 24 * 60 * 60 * 1000).toISOString();
        this.db.prepare('DELETE FROM clipboardHistories WHERE copyTime < ?').run(cutoff);
    }

}

export default ClipboardRepository;