import { BrowserWindow, BrowserWindowConstructorOptions } from 'electron'

const windows = new Map(); // id -> BrowserWindow

export function createMainWindow(opts: BrowserWindowConstructorOptions) {
    const win = new BrowserWindow(opts);
    windows.set(win.id, win);
    win.on('closed', () => windows.delete(win.id));
    return win;
}
export function broadcast(channel: string, payload: object) {
    console.log("window values: ", windows.values())
    for (const win of windows.values()) {
        if (!win.isDestroyed()) win.webContents.send(channel, payload);
    }
}


