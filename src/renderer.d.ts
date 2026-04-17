import { ClipboardHistory } from './types';

declare global {
  interface Window {
    clipboardAPI: {
      getClipboardHistory: (pageSize: number, cursor?: { copyTime: string; id: number }) => Promise<{ items: ClipboardHistory[]; hasMore: boolean }>;
      searchClipboardHistory: (query: string, pageSize: number, cursor?: { isStarred: number; copyTime: string; id: number }) => Promise<{ items: ClipboardHistory[]; hasMore: boolean }>;
      toggleStar: (id: number) => Promise<ClipboardHistory | null>;
      onClipboardChanged: (cb: (item: ClipboardHistory) => void) => () => void;
      onWindowShown: (cb: () => void) => () => void;
      hideWindow: () => Promise<void>;
      pasteItem: (text: string) => Promise<void>;
    };
  }
}