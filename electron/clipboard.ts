import { clipboard } from 'electron'
import IClipboardRepository from './repository/IClipboardRepository'
import ClipboardRepository from './repository/ClipboardRepository'

class ClipboardTracker {
    private lastText: string;
    private repo: IClipboardRepository | null;

    constructor() {
        this.lastText = '';
        this.repo = null;
    }
    startTracking() {
        if (this.repo === null) {
            this.repo = new ClipboardRepository();
        }
        console.log("testing")
        setInterval(() => this.tick(), 500);
        this.tick()
    }

    private tick() {
        const currText = clipboard.readText();
        console.log("hello world!")

        if (currText !== this.lastText) {
            this.lastText = currText;
            this.repo!.addToClipBoardHistory(currText);
        }

    }
}

export default ClipboardTracker;