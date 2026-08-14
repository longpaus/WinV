import { BrowserWindow, BrowserWindowConstructorOptions, screen } from 'electron'

const windows = new Map(); // id -> BrowserWindow

// Aim the cursor at the center of the first history item so the user can click
// it immediately. The history column occupies 38% of the window, and its first
// item is centered roughly 108 px below the top of the window.
const HISTORY_COLUMN_WIDTH_RATIO = 0.38;
const HISTORY_TARGET_X_RATIO = HISTORY_COLUMN_WIDTH_RATIO / 2;
const FIRST_HISTORY_ITEM_CENTER_Y = 108;

function clamp(value: number, min: number, max: number) {
    return Math.min(Math.max(value, min), Math.max(min, max));
}

export function positionWindowNearCursor(win: BrowserWindow) {
    const cursor = screen.getCursorScreenPoint();
    const { workArea } = screen.getDisplayNearestPoint(cursor);
    const { width, height } = win.getBounds();
    const workAreaRight = workArea.x + workArea.width;
    const workAreaBottom = workArea.y + workArea.height;

    // Place the newest history item under the existing pointer position. Near
    // screen edges, clamping keeps the full window visible and gets the history
    // list as close to the pointer as the available space allows.
    const x = cursor.x - width * HISTORY_TARGET_X_RATIO;
    const y = cursor.y - FIRST_HISTORY_ITEM_CENTER_Y;
    const maxX = workAreaRight - width;
    const maxY = workAreaBottom - height;
    win.setPosition(
        Math.round(clamp(x, workArea.x, maxX)),
        Math.round(clamp(y, workArea.y, maxY)),
        false,
    );
}

export function createMainWindow(opts: BrowserWindowConstructorOptions) {
    const win = new BrowserWindow(opts);
    windows.set(win.id, win);
    win.on('closed', () => windows.delete(win.id));
    return win;
}
export function broadcast(channel: string, payload: object) {
    for (const win of windows.values()) {
        if (!win.isDestroyed()) win.webContents.send(channel, payload);
    }
}


