var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
import { app, clipboard, BrowserWindow } from "electron";
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
      const clipboardHistory = this.db.prepare(`select * from clipboardHistories order by copyTime limit ${limit}`).all();
      return clipboardHistory;
    } catch (error) {
      throw new Error(`Error getting clipboard history: ${error}`);
    }
  }
  addToClipBoardHistory(content) {
    try {
      const now = (/* @__PURE__ */ new Date()).toISOString();
      this.db.prepare("insert into clipboardHistories (content, copyTime) values (?,?)").run(content, now);
      return true;
    } catch (error) {
      throw new Error(`Error getting clipboard history: ${error}`);
    }
  }
}
class ClipboardTracker {
  constructor() {
    __publicField(this, "lastText");
    __publicField(this, "repo");
    this.lastText = "";
    this.repo = null;
  }
  startTracking() {
    if (this.repo === null) {
      this.repo = new ClipboardRepository();
    }
    console.log("testing");
    setInterval(() => this.tick(), 500);
    this.tick();
  }
  tick() {
    const currText = clipboard.readText();
    console.log("hello world!");
    if (currText !== this.lastText) {
      this.lastText = currText;
      this.repo.addToClipBoardHistory(currText);
    }
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
function createWindow() {
  win = new BrowserWindow({
    title: app.getName(),
    // mac menu title
    icon: path.join(process.env.VITE_PUBLIC, "electron-vite.svg"),
    width: 1100,
    height: 700,
    webPreferences: {
      preload: PRELOAD_PATH,
      // ✅ correct, ESM-safe preload path
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path.join(RENDERER_DIST, "index.html"));
  }
  win.webContents.on("did-finish-load", () => {
    win == null ? void 0 : win.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
  });
}
app.whenReady().then(() => {
  console.log("App Name:", app.getName());
  console.log("userData:", app.getPath("userData"));
  console.log("Preload :", PRELOAD_PATH);
  getDb();
  const tracker = new ClipboardTracker();
  tracker.startTracking();
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
}).catch((err) => {
  console.error("App init failed:", err);
  app.quit();
});
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Rejection:", reason);
});
export {
  MAIN_DIST,
  RENDERER_DIST,
  VITE_DEV_SERVER_URL
};
