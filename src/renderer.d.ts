import { ClipboardHistory } from './types';

declare global {
  interface Window {
    clipboardAPI: {
      getClipboardHistory: (pageSize: number, cursor?: { copyTime: string; id: number }) => Promise<{ items: ClipboardHistory[]; hasMore: boolean }>;
      onClipboardChanged: (cb: (item: ClipboardHistory) => void) => () => void;
      onWindowShown: (cb: () => void) => () => void;
      hideWindow: () => Promise<void>;
      pasteItem: (text: string) => Promise<void>;
    };
  }
}