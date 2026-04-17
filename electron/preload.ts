import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron'
import { CopyItem } from './types/clipboard'

export interface IElectronAPI {
  getClipboardHistory: (pageSize: number, cursor?: { copyTime: string; id: number }) => Promise<{ items: CopyItem[]; hasMore: boolean }>
  searchClipboardHistory: (query: string, pageSize: number, cursor?: { isStarred: number; copyTime: string; id: number }) => Promise<{ items: CopyItem[]; hasMore: boolean }>
  toggleStar: (id: number) => Promise<CopyItem | null>
  onClipboardChanged: (cb: (item: CopyItem) => void) => () => void
  onWindowShown: (cb: () => void) => () => void
  hideWindow: () => Promise<void>
  pasteItem: (text: string) => Promise<void>
}

const api: IElectronAPI = {
  getClipboardHistory: (pageSize, cursor?) => ipcRenderer.invoke('get-clipboard-history', pageSize, cursor),
  searchClipboardHistory: (query, pageSize, cursor?) => ipcRenderer.invoke('search-clipboard-history', query, pageSize, cursor),
  toggleStar: (id) => ipcRenderer.invoke('toggle-star', id),
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