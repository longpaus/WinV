// main.ts (macOS, ESM)
import { app, BrowserWindow } from 'electron';
import { fileURLToPath } from 'node:url';
import path, { dirname, join } from 'node:path';
import fs from 'node:fs';
import { getDb } from './db';
import ClipboardTracker from './clipboard';

// Optional: silence GPU dev noise on mac
// app.disableHardwareAcceleration();

// --- Recreate __filename/__dirname for ESM ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// App root & build dirs
process.env.APP_ROOT = path.join(__dirname, '..');
export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL'];
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron');
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist');

// Resolve preload path robustly (supports either preload.mjs or preload/index.js)
const preloadCandidates = [
  join(MAIN_DIST, 'preload.mjs'),
  join(MAIN_DIST, 'preload/index.js'),
  join(MAIN_DIST, 'preload.js'),
];
const PRELOAD_PATH = preloadCandidates.find(p => fs.existsSync(p)) ?? preloadCandidates[0];

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, 'public')
  : RENDERER_DIST;

let win: BrowserWindow | null = null;

function createWindow() {
  win = new BrowserWindow({
    title: app.getName(), // mac menu title
    icon: path.join(process.env.VITE_PUBLIC!, 'electron-vite.svg'),
    width: 1100,
    height: 700,
    webPreferences: {
      preload: PRELOAD_PATH,     // ✅ correct, ESM-safe preload path
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path.join(RENDERER_DIST, 'index.html'));
  }

  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', new Date().toLocaleString());
  });
}

app.whenReady()
  .then(() => {
    // (Optional) Give your app a nice name on mac; controls ~/Library/Application Support/<name>/
    // app.setName('Clipboard Tracker');

    // Log where your DB will live (mac: ~/Library/Application Support/<AppName>/app.db)
    console.log('App Name:', app.getName());
    console.log('userData:', app.getPath('userData'));
    console.log('Preload :', PRELOAD_PATH);

    getDb(); // Ensure DB + schema
    const tracker = new ClipboardTracker();
    tracker.startTracking(); // Start clipboard polling

    createWindow();

    app.on('activate', () => {
      // mac: re-create a window when dock icon is clicked and no other windows are open
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  })
  .catch((err) => {
    console.error('App init failed:', err);
    app.quit();
  });

// mac behavior: keep app running until Cmd+Q
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// Helpful while debugging rejections
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
});
