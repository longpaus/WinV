import { CopyItem } from '../types/clipboard'

interface IClipboardRepository {
    getClipBoardHistory(limit: number): CopyItem[]
    addToClipBoardHistory(content: string): boolean
}

export default IClipboardRepository
