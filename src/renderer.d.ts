import { ClipboardHistory } from './types';

declare global {
  interface Window {
    clipboardAPI: {
      getClipboardHistory: () => Promise<ClipboardHistory[]>;
      onClipboardChanged: (cb: (item: ClipboardHistory) => void) => void;
    };
  }
}