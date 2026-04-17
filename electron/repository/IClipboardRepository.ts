import { CopyItem } from '../types/clipboard'

export interface ClipboardCursor {
    copyTime: string
    id: number
}

export interface SearchCursor {
    isStarred: number
    copyTime: string
    id: number
}

interface IClipboardRepository {
    getClipBoardHistory(limit: number): CopyItem[]
    getClipBoardHistoryPage(limit: number, cursor?: ClipboardCursor): { items: CopyItem[]; hasMore: boolean }
    addToClipBoardHistory(content: string): CopyItem
    toggleStar(id: number): CopyItem | null
    searchClipBoardHistory(query: string, limit: number, cursor?: SearchCursor): { items: CopyItem[]; hasMore: boolean }
}

export default IClipboardRepository
