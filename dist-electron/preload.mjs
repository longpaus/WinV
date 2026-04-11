"use strict";
const electron = require("electron");
const api = {
  getClipboardHistory: () => electron.ipcRenderer.invoke("get-clipboard-history"),
  onClipboardChanged: (cb) => {
    const listener = (_event, item) => cb(item);
    electron.ipcRenderer.on("clipboard:changed", listener);
    return () => {
      electron.ipcRenderer.removeListener("clipboard:changed", listener);
    };
  },
  onWindowShown: (cb) => {
    const listener = () => cb();
    electron.ipcRenderer.on("window-shown", listener);
    return () => {
      electron.ipcRenderer.removeListener("window-shown", listener);
    };
  },
  hideWindow: () => electron.ipcRenderer.invoke("hide-window"),
  pasteItem: (text) => electron.ipcRenderer.invoke("paste-item", text)
};
electron.contextBridge.exposeInMainWorld("clipboardAPI", api);
