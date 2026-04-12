import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron'
import { CopyItem } from './types/clipboard'

export interface IElectronAPI {
  getClipboardHistory: (pageSize: number, cursor?: { copyTime: string; id: number }) => Promise<{ items: CopyItem[]; hasMore: boolean }>
  onClipboardChanged: (cb: (item: CopyItem) => void) => () => void
  onWindowShown: (cb: () => void) => () => void
  hideWindow: () => Promise<void>
  pasteItem: (text: string) => Promise<void>
}

const api: IElectronAPI = {
  getClipboardHistory: (pageSize, cursor?) => ipcRenderer.invoke('get-clipboard-history', pageSize, cursor),
  onClipboardChanged: (cb: (item: CopyItem) => void) => {
    const listener = (_event: IpcRendererEvent, item: CopyItem) => cb(item)
    ipcRenderer.on('clipboard:changed', listener)
    return () => {
      ipcRenderer.removeListener('clipboard:changed', listener)
    }
  },
  onWindowShown: (cb: () => void) => {
    const listener = () => cb()
    ipcRenderer.on('window-shown', listener)
    return () => {
      ipcRenderer.removeListener('window-shown', listener)
    }
  },
  hideWindow: () => ipcRenderer.invoke('hide-window'),
  pasteItem: (text: string) => ipcRenderer.invoke('paste-item', text),
}

contextBridge.exposeInMainWorld('clipboardAPI', api)