import { CopyItem } from "../types/clipboard";
import IClipboardRepository, { ClipboardCursor, SearchCursor } from "./IClipboardRepository";
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
            const clipboardHistory: CopyItem[] = this.db.prepare(`select * from clipboardHistories order by copyTime desc limit ?`).all(limit) as CopyItem[];
            return clipboardHistory;
        } catch (error) {
            throw new Error(`Error getting clipboard history: ${error}`);
        }
    }
    getClipBoardHistoryPage(limit: number, cursor?: ClipboardCursor): { items: CopyItem[]; hasMore: boolean } {
        try {
            const fetchCount = limit + 1;
            let rows: CopyItem[];
            if (cursor) {
                rows = this.db.prepare(
                    `SELECT * FROM clipboardHistories
                     WHERE copyTime < ? OR (copyTime = ? AND id < ?)
                     ORDER BY copyTime DESC, id DESC
                     LIMIT ?`
                ).all(cursor.copyTime, cursor.copyTime, cursor.id, fetchCount) as CopyItem[];
            } else {
                rows = this.db.prepare(
                    `SELECT * FROM clipboardHistories ORDER BY copyTime DESC, id DESC LIMIT ?`
                ).all(fetchCount) as CopyItem[];
            }
            const hasMore = rows.length > limit;
            const items = hasMore ? rows.slice(0, limit) : rows;
            return { items, hasMore };
        } catch (error) {
            throw new Error(`Error getting clipboard history page: ${error}`);
        }
    }
    addToClipBoardHistory(content: string): CopyItem {
        try {
            const now = new Date().toISOString();
            const result = this.db.prepare('insert into clipboardHistories (content, copyTime) values (?,?)').run(content, now);
            this.trimOlderThanMaxAge();
            return { id: Number(result.lastInsertRowid), content, copyTime: now, isStarred: 0 }
        } catch (error) {
            throw new Error(`Error getting clipboard history: ${error}`);
        }
    }

    toggleStar(id: number): CopyItem | null {
        try {
            const row = this.db.prepare(
                'UPDATE clipboardHistories SET isStarred = 1 - isStarred WHERE id = ? RETURNING *'
            ).get(id) as CopyItem | undefined;
            return row ?? null;
        } catch (error) {
            throw new Error(`Error toggling star: ${error}`);
        }
    }

    searchClipBoardHistory(query: string, limit: number, cursor?: SearchCursor): { items: CopyItem[]; hasMore: boolean } {
        try {
            const escaped = query.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_');
            const pattern = `%${escaped}%`;
            const fetchCount = limit + 1;
            let rows: CopyItem[];
            if (cursor) {
                rows = this.db.prepare(
                    `SELECT * FROM clipboardHistories
                     WHERE content LIKE ? ESCAPE '\\'
                       AND (
                         isStarred < ?
                         OR (isStarred = ? AND copyTime < ?)
                         OR (isStarred = ? AND copyTime = ? AND id < ?)
                       )
                     ORDER BY isStarred DESC, copyTime DESC, id DESC
                     LIMIT ?`
                ).all(
                    pattern,
                    cursor.isStarred,
                    cursor.isStarred, cursor.copyTime,
                    cursor.isStarred, cursor.copyTime, cursor.id,
                    fetchCount
                ) as CopyItem[];
            } else {
                rows = this.db.prepare(
                    `SELECT * FROM clipboardHistories
                     WHERE content LIKE ? ESCAPE '\\'
                     ORDER BY isStarred DESC, copyTime DESC, id DESC
                     LIMIT ?`
                ).all(pattern, fetchCount) as CopyItem[];
            }
            const hasMore = rows.length > limit;
            const items = hasMore ? rows.slice(0, limit) : rows;
            return { items, hasMore };
        } catch (error) {
            throw new Error(`Error searching clipboard history: ${error}`);
        }
    }

    private trimOlderThanMaxAge(): void {
        const { maxHistoryDays } = getConfig();
        const cutoff = new Date(Date.now() - maxHistoryDays * 24 * 60 * 60 * 1000).toISOString();
        this.db.prepare('DELETE FROM clipboardHistories WHERE copyTime < ? AND isStarred = 0').run(cutoff);
    }

}

export default ClipboardRepository;