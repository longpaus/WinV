import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron'
import { CopyItem } from './types/clipboard'

export interface IElectronAPI {
  getClipboardHistory: () => Promise<CopyItem[]>
  onClipboardChanged: (cb: (item: CopyItem) => void) => () => void
  hideWindow: () => Promise<void>
  pasteItem: (text: string) => Promise<void>
}

const api: IElectronAPI = {
  getClipboardHistory: () => ipcRenderer.invoke('get-clipboard-history'),
  onClipboardChanged: (cb: (item: CopyItem) => void) => {
    const listener = (_event: IpcRendererEvent, item: CopyItem) => cb(item)
    ipcRenderer.on('clipboard:changed', listener)
    return () => {
      ipcRenderer.removeListener('clipboard:changed', listener)
    }
  },
  hideWindow: () => ipcRenderer.invoke('hide-window'),
  pasteItem: (text: string) => ipcRenderer.invoke('paste-item', text),
}

contextBridge.exposeInMainWorld('clipboardAPI', api)