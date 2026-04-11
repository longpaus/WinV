// main.ts (macOS, ESM)
import { app, BrowserWindow, ipcMain, globalShortcut, clipboard } from 'electron';
import { fileURLToPath } from 'node:url';
import path, { dirname, join } from 'node:path';
import fs from 'node:fs';
import { execFile } from 'node:child_process';
import { getDb } from './db';
import ClipboardTracker from './clipboard';
import ClipboardRepository from './repository/ClipboardRepository';
import { createMainWindow, broadcast } from './windowManager';
import { CopyItem } from './types/clipboard';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

process.env.APP_ROOT = path.join(__dirname, '..');
export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL'];
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron');
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist');

const preloadCandidates = [
  join(MAIN_DIST, 'preload.mjs'),
  join(MAIN_DIST, 'preload/index.js'),
  join(MAIN_DIST, 'preload.js'),
];
const PRELOAD_PATH = preloadCandidates.find(p => fs.existsSync(p)) ?? preloadCandidates[0];

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, 'public')
  : RENDERER_DIST;

// ----------------------
// Keep a single window
// ----------------------
let win: BrowserWindow | null = null;
let isQuitting = false;
let tracker: ClipboardTracker | null = null;

function getOrCreateWindow() {
  if (win && !win.isDestroyed()) return win;

  win = createMainWindow({
    title: app.getName(),
    icon: path.join(process.env.VITE_PUBLIC!, 'electron-vite.svg'),
    width: 820,
    height: 520,
    show: false, // keep hidden until we want to reveal
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    backgroundColor: '#0b0b0f',
    webPreferences: {
      preload: PRELOAD_PATH,
      contextIsolation: true,
      nodeIntegration: false,
      // If you want background timers to keep running when hidden:
      backgroundThrottling: false,
    },
  });

  if (VITE_DEV_SERVER_URL) {
    // Dev: load Vite server ONCE. Subsequent show/hide is instant.
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path.join(RENDERER_DIST, 'index.html'));
  }

  win.once('ready-to-show', () => {
    // Don't auto-show; we’ll show on hotkey or activation
  });

  // Important: hide instead of destroy, so next reveal is instant
  win.on('close', (e) => {
    if (process.platform === 'darwin' && !isQuitting) {
      e.preventDefault();
      win?.hide();
    } else {
      win = null;
    }
  });

  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', new Date().toLocaleString());
  });

  return win;
}

function revealWindow() {
  const w = getOrCreateWindow();

  if (w.isMinimized()) w.restore();

  // Show & focus quickly without reloading the page
  w.show();

  if (process.platform !== 'darwin') {
    // Nudge focus on Win/Linux
    w.setAlwaysOnTop(true, 'floating');
    w.focus();
    setTimeout(() => w.setAlwaysOnTop(false), 200);
  } else {
    // macOS: hop across spaces briefly so reveal is reliable
    w.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
    w.focus();
    setTimeout(() => w.setVisibleOnAllWorkspaces(false), 200);
  }

  w.webContents.send('window-shown');
}

// ----------------------
// Global shortcut
// ----------------------
function registerShortcuts() {
  const ok = globalShortcut.register('Alt+V', revealWindow); // ⌥V

  if (!ok) {
    console.error('Failed to register global shortcut Alt+V');
  }
}

app.whenReady()
  .then(() => {
    console.log('App Name:', app.getName());
    console.log('userData:', app.getPath('userData'));
    console.log('Preload :', PRELOAD_PATH);

    getDb();

    tracker = new ClipboardTracker((payload: CopyItem) =>
      broadcast('clipboard:changed', payload)
    );
    tracker.startTracking();

    getOrCreateWindow();     // create once, keep around
    registerShortcuts();

    app.on('activate', () => {
      // mac: re-open / show main window on dock click
      if (BrowserWindow.getAllWindows().length === 0) getOrCreateWindow();
      revealWindow();
    });
  })
  .catch((err) => {
    console.error('App init failed:', err);
    app.quit();
  });

app.on('before-quit', () => { isQuitting = true; });

// mac stays running until Cmd+Q; other OSes quit when last window closed
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// Clean up shortcuts
app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
});

ipcMain.handle('get-clipboard-history', () => {
  const repo = new ClipboardRepository();
  return repo.getClipBoardHistory(20);
});

ipcMain.handle('hide-window', () => {
  if (win && !win.isDestroyed()) win.hide();
});

ipcMain.handle('paste-item', async (_evt, text: string) => {
  if (typeof text !== 'string') return;
  tracker?.suppressText(text);
  clipboard.writeText(text);

  if (process.platform === 'darwin') {
    app.hide();
  } else if (win && !win.isDestroyed()) {
    win.hide();
  }

  if (process.platform !== 'darwin') return;

  await new Promise<void>((resolve) => {
    execFile(
      '/usr/bin/osascript',
      ['-e', 'tell application "System Events" to keystroke "v" using command down'],
      (err) => {
        if (err) console.error('paste-item osascript failed:', err);
        resolve();
      }
    );
  });
});
