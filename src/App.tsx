import { useCallback, useEffect, useRef, useState } from 'react';
import './App.css';
import { ClipboardHistory } from './types';
import { HistorySidebar } from './components/HistorySidebar';
import { ContentDisplay } from './components/ContentDisplay';
import { MAX_CLIPBOARD_ITEMS, PAGE_SIZE } from './constants';

function App() {
  const [clipboardHistory, setClipboardHistory] = useState<ClipboardHistory[]>([]);
  const [selectedItem, setSelectedItem] = useState<ClipboardHistory | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const isFocusedRef = useRef(document.hasFocus());

  useEffect(() => {
    const onFocus = () => { isFocusedRef.current = true; };
    const onBlur = () => { isFocusedRef.current = false; };
    window.addEventListener('focus', onFocus);
    window.addEventListener('blur', onBlur);
    return () => {
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('blur', onBlur);
    };
  }, []);

  useEffect(() => {
    window.clipboardAPI.getClipboardHistory(PAGE_SIZE).then(({ items, hasMore: more }) => {
      setClipboardHistory(items);
      setHasMore(more);
      if (items.length > 0) {
        setSelectedItem(items[0]);
      }
    });

    const cleanup = window.clipboardAPI.onClipboardChanged((newItem) => {
      setClipboardHistory((prev) => {
        const next = [newItem, ...prev];
        if (!isFocusedRef.current && next.length > MAX_CLIPBOARD_ITEMS) {
          return next.slice(0, MAX_CLIPBOARD_ITEMS);
        }
        return next;
      });
      setSelectedItem((prev) => prev ?? newItem);
    });

    return cleanup;
  }, []);

  const pasteItem = useCallback((item: ClipboardHistory) => {
    window.clipboardAPI.pasteItem(item.content);
  }, []);

  const loadMore = useCallback(() => {
    if (isLoadingMore || !hasMore) return;
    if (clipboardHistory.length >= MAX_CLIPBOARD_ITEMS) {
      setHasMore(false);
      return;
    }

    setIsLoadingMore(true);
    const lastItem = clipboardHistory[clipboardHistory.length - 1];
    const cursor = lastItem ? { copyTime: lastItem.copyTime, id: lastItem.id } : undefined;

    window.clipboardAPI.getClipboardHistory(PAGE_SIZE, cursor).then(({ items, hasMore: moreAvailable }) => {
      setClipboardHistory((prev) => {
        const combined = [...prev, ...items];
        return combined.length >= MAX_CLIPBOARD_ITEMS
          ? combined.slice(0, MAX_CLIPBOARD_ITEMS)
          : combined;
      });
      const totalAfter = clipboardHistory.length + items.length;
      setHasMore(totalAfter < MAX_CLIPBOARD_ITEMS && moreAvailable);
      setIsLoadingMore(false);
    }).catch(() => {
      setIsLoadingMore(false);
    });
  }, [clipboardHistory, hasMore, isLoadingMore]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (clipboardHistory.length === 0) {
        if (e.key === 'Escape') window.clipboardAPI.hideWindow?.();
        return;
      }
      const idx = selectedItem
        ? clipboardHistory.findIndex((i) => i.id === selectedItem.id)
        : -1;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        const next = idx < 0 ? 0 : Math.min(clipboardHistory.length - 1, idx + 1);
        setSelectedItem(clipboardHistory[next]);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const next = idx <= 0 ? 0 : idx - 1;
        setSelectedItem(clipboardHistory[next]);
      } else if (e.key === 'Enter') {
        const target = selectedItem ?? clipboardHistory[0];
        if (target) {
          e.preventDefault();
          pasteItem(target);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        window.clipboardAPI.hideWindow?.();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [clipboardHistory, selectedItem, pasteItem]);

  const historyRef = useRef(clipboardHistory);
  useEffect(() => {
    historyRef.current = clipboardHistory;
  }, [clipboardHistory]);

  useEffect(() => {
    return window.clipboardAPI.onWindowShown(() => {
      const first = historyRef.current[0];
      if (first) setSelectedItem(first);
    });
  }, []);

  return (
    <div className="flex flex-col h-screen w-screen bg-[color:var(--bg)] text-[color:var(--fg)] overflow-hidden rounded-xl border border-[color:var(--border)]">
      <header
        className="shrink-0 flex items-center px-4 h-11 border-b border-[color:var(--border)] select-none"
        style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
      >
        <div className="flex items-center gap-2 pl-16">
          <span className="text-[13px] font-semibold tracking-tight text-[color:var(--fg)]">
            Clipboard
          </span>
          <span className="text-[11px] text-[color:var(--fg-subtle)] tabular-nums">
            {clipboardHistory.length} {clipboardHistory.length === 1 ? 'item' : 'items'}
          </span>
        </div>
      </header>
      <div className="flex-1 min-h-0 flex">
        <HistorySidebar
          history={clipboardHistory}
          selectedItem={selectedItem}
          onSelectItem={setSelectedItem}
          onLoadMore={loadMore}
          hasMore={hasMore}
          isLoadingMore={isLoadingMore}
        />
        <ContentDisplay selectedItem={selectedItem} />
      </div>
    </div>
  );
}

export default App;
