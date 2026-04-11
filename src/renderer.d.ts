import { ClipboardHistory } from './types';

declare global {
  interface Window {
    clipboardAPI: {
      getClipboardHistory: () => Promise<ClipboardHistory[]>;
      onClipboardChanged: (cb: (item: ClipboardHistory) => void) => () => void;
      onWindowShown: (cb: () => void) => () => void;
      hideWindow: () => Promise<void>;
      pasteItem: (text: string) => Promise<void>;
    };
  }
}