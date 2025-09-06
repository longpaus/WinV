import { clipboard } from 'electron'
import IClipboardRepository from './repository/IClipboardRepository'
import ClipboardRepository from './repository/ClipboardRepository'
import { CopyItem } from './types/clipboard';

type OnChange = (payload: CopyItem) => void;

class ClipboardTracker {
    private lastText: string;
    private repo: IClipboardRepository | null;
    private onChange: OnChange;

    constructor(onChange: OnChange) {
        this.repo = new ClipboardRepository();
        this.lastText = this.repo.getClipBoardHistory(1)[0].content;
        this.onChange = onChange;
    }
    startTracking() {
        setInterval(() => this.tick(), 500);
    }

    private tick() {
        const currText = clipboard.readText();

        if (currText !== this.lastText) {
            this.lastText = currText;
            const copyItem = this.repo!.addToClipBoardHistory(currText);
            this.onChange(copyItem)
        }

    }
}

export default ClipboardTracker;