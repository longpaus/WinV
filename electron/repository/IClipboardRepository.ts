import { CopyItem } from '../types/clipboard'

export interface ClipboardCursor {
    copyTime: string
    id: number
}

interface IClipboardRepository {
    getClipBoardHistory(limit: number): CopyItem[]
    getClipBoardHistoryPage(limit: number, cursor?: ClipboardCursor): { items: CopyItem[]; hasMore: boolean }
    addToClipBoardHistory(content: string): CopyItem
}

export default IClipboardRepository
