"use strict";
const electron = require("electron");
const api = {
  getClipboardHistory: () => electron.ipcRenderer.invoke("get-clipboard-history"),
  onClipboardChanged: (cb) => {
    const listener = (_event, item) => cb(item);
    electron.ipcRenderer.on("clipboard:changed", listener);
  }
};
electron.contextBridge.exposeInMainWorld("clipboardAPI", api);
