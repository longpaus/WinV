var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
import { app, clipboard, BrowserWindow, globalShortcut, ipcMain } from "electron";
import { fileURLToPath } from "node:url";
import path, { dirname, join } from "node:path";
import fs from "node:fs";
import Database from "better-sqlite3";
let db = null;
function getDb() {
  if (db) return db;
  const dir = app.getPath("userData");
  const file = path.join(dir, "app.db");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  db = new Database(file);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  initSchema(db);
  return db;
}
function initSchema(db2) {
  db2.prepare(`
    CREATE TABLE IF NOT EXISTS clipboardHistories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        content TEXT NOT NULL,
        copyTime TEXT NOT NULL
    )`).run();
  db2.prepare(`
    CREATE INDEX IF NOT EXISTS idx_clipboard_copyTime ON clipboardHistories(copyTime)
    `).run();
}
class ClipboardRepository {
  constructor() {
    __publicField(this, "db");
    this.db = getDb();
  }
  getClipBoardHistory(limit) {
    try {
      const clipboardHistory = this.db.prepare(`select * from clipboardHistories order by copyTime desc limit ${limit}`).all();
      return clipboardHistory;
    } catch (error) {
      throw new Error(`Error getting clipboard history: ${error}`);
    }
  }
  addToClipBoardHistory(content) {
    try {
      const now = (/* @__PURE__ */ new Date()).toISOString();
      this.db.prepare("insert into clipboardHistories (content, copyTime) values (?,?)").run(content, now);
      return { content, copyTime: now };
    } catch (error) {
      throw new Error(`Error getting clipboard history: ${error}`);
    }
  }
}
class ClipboardTracker {
  constructor(onChange) {
    __publicField(this, "lastText");
    __publicField(this, "repo");
    __publicField(this, "onChange");
    this.repo = new ClipboardRepository();
    this.lastText = this.repo.getClipBoardHistory(1)[0].content;
    this.onChange = onChange;
  }
  startTracking() {
    setInterval(() => this.tick(), 500);
  }
  tick() {
    const currText = clipboard.readText();
    if (currText !== this.lastText) {
      console.log("add to db: ", currText);
      this.lastText = currText;
      const copyItem = this.repo.addToClipBoardHistory(currText);
      this.onChange(copyItem);
    }
  }
}
const windows = /* @__PURE__ */ new Map();
function createMainWindow(opts) {
  const win2 = new BrowserWindow(opts);
  windows.set(win2.id, win2);
  win2.on("closed", () => windows.delete(win2.id));
  return win2;
}
function broadcast(channel, payload) {
  console.log("window values: ", windows.values());
  for (const win2 of windows.values()) {
    if (!win2.isDestroyed()) win2.webContents.send(channel, payload);
  }
}
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
process.env.APP_ROOT = path.join(__dirname, "..");
const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
const MAIN_DIST = path.join(process.env.APP_ROOT, "dist-electron");
const RENDERER_DIST = path.join(process.env.APP_ROOT, "dist");
const preloadCandidates = [
  join(MAIN_DIST, "preload.mjs"),
  join(MAIN_DIST, "preload/index.js"),
  join(MAIN_DIST, "preload.js")
];
const PRELOAD_PATH = preloadCandidates.find((p) => fs.existsSync(p)) ?? preloadCandidates[0];
process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, "public") : RENDERER_DIST;
let win = null;
let isQuitting = false;
function getOrCreateWindow() {
  if (win && !win.isDestroyed()) return win;
  win = createMainWindow({
    title: app.getName(),
    icon: path.join(process.env.VITE_PUBLIC, "electron-vite.svg"),
    width: 820,
    height: 520,
    show: false,
    // keep hidden until we want to reveal
    webPreferences: {
      preload: PRELOAD_PATH,
      contextIsolation: true,
      nodeIntegration: false,
      // If you want background timers to keep running when hidden:
      backgroundThrottling: false
    }
  });
  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path.join(RENDERER_DIST, "index.html"));
  }
  win.once("ready-to-show", () => {
  });
  win.on("close", (e) => {
    if (process.platform === "darwin" && !isQuitting) {
      e.preventDefault();
      win == null ? void 0 : win.hide();
    } else {
      win = null;
    }
  });
  win.webContents.on("did-finish-load", () => {
    win == null ? void 0 : win.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
  });
  return win;
}
function revealWindow() {
  const w = getOrCreateWindow();
  if (w.isMinimized()) w.restore();
  w.show();
  if (process.platform !== "darwin") {
    w.setAlwaysOnTop(true, "floating");
    w.focus();
    setTimeout(() => w.setAlwaysOnTop(false), 200);
  } else {
    w.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
    w.focus();
    setTimeout(() => w.setVisibleOnAllWorkspaces(false), 200);
  }
}
function registerShortcuts() {
  const ok = globalShortcut.register("Alt+V", revealWindow);
  if (!ok) {
    console.error("Failed to register global shortcut Alt+V");
  }
}
app.whenReady().then(() => {
  console.log("App Name:", app.getName());
  console.log("userData:", app.getPath("userData"));
  console.log("Preload :", PRELOAD_PATH);
  getDb();
  const tracker = new ClipboardTracker(
    (payload) => broadcast("clipboard:changed", payload)
  );
  tracker.startTracking();
  getOrCreateWindow();
  registerShortcuts();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) getOrCreateWindow();
    revealWindow();
  });
}).catch((err) => {
  console.error("App init failed:", err);
  app.quit();
});
app.on("before-quit", () => {
  isQuitting = true;
});
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
app.on("will-quit", () => {
  globalShortcut.unregisterAll();
});
process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Rejection:", reason);
});
ipcMain.handle("get-clipboard-history", () => {
  const repo = new ClipboardRepository();
  return repo.getClipBoardHistory(20);
});
export {
  MAIN_DIST,
  RENDERER_DIST,
  VITE_DEV_SERVER_URL
};
