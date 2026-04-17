import { useCallback, useEffect, useRef, useState } from 'react';
import './App.css';
import { ClipboardHistory } from './types';
import { HistorySidebar } from './components/HistorySidebar';
import { ContentDisplay } from './components/ContentDisplay';
import { SearchBar, SearchBarHandle } from './components/SearchBar';
import { MAX_CLIPBOARD_ITEMS, PAGE_SIZE } from './constants';

type Mode = 'recent' | 'search';

function App() {
  const [clipboardHistory, setClipboardHistory] = useState<ClipboardHistory[]>([]);
  const [selectedItem, setSelectedItem] = useState<ClipboardHistory | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const isFocusedRef = useRef(document.hasFocus());
  const searchBarRef = useRef<SearchBarHandle>(null);

  const mode: Mode = searchQuery.trim().length > 0 ? 'search' : 'recent';
  const modeRef = useRef(mode);
  useEffect(() => { modeRef.current = mode; }, [mode]);

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
    const handle = setTimeout(() => setSearchQuery(searchInput), 150);
    return () => clearTimeout(handle);
  }, [searchInput]);

  const loadFirstPage = useCallback((query: string) => {
    const trimmed = query.trim();
    const fetcher = trimmed.length > 0
      ? window.clipboardAPI.searchClipboardHistory(trimmed, PAGE_SIZE)
      : window.clipboardAPI.getClipboardHistory(PAGE_SIZE);

    fetcher.then(({ items, hasMore: more }) => {
      setClipboardHistory(items);
      setHasMore(more);
      setSelectedItem(items[0] ?? null);
    });
  }, []);

  useEffect(() => {
    loadFirstPage(searchQuery);
  }, [searchQuery, loadFirstPage]);

  useEffect(() => {
    const cleanup = window.clipboardAPI.onClipboardChanged((newItem) => {
      if (modeRef.current === 'search') return;
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
    if (mode === 'recent' && clipboardHistory.length >= MAX_CLIPBOARD_ITEMS) {
      setHasMore(false);
      return;
    }

    setIsLoadingMore(true);
    const lastItem = clipboardHistory[clipboardHistory.length - 1];

    const request = mode === 'search' && lastItem
      ? window.clipboardAPI.searchClipboardHistory(searchQuery.trim(), PAGE_SIZE, {
          isStarred: lastItem.isStarred,
          copyTime: lastItem.copyTime,
          id: lastItem.id,
        })
      : window.clipboardAPI.getClipboardHistory(
          PAGE_SIZE,
          lastItem ? { copyTime: lastItem.copyTime, id: lastItem.id } : undefined
        );

    request.then(({ items, hasMore: moreAvailable }) => {
      setClipboardHistory((prev) => {
        const combined = [...prev, ...items];
        if (mode === 'recent' && combined.length >= MAX_CLIPBOARD_ITEMS) {
          return combined.slice(0, MAX_CLIPBOARD_ITEMS);
        }
        return combined;
      });
      const totalAfter = clipboardHistory.length + items.length;
      setHasMore(
        mode === 'recent'
          ? totalAfter < MAX_CLIPBOARD_ITEMS && moreAvailable
          : moreAvailable
      );
      setIsLoadingMore(false);
    }).catch(() => {
      setIsLoadingMore(false);
    });
  }, [clipboardHistory, hasMore, isLoadingMore, searchQuery]);

  const toggleStar = useCallback((id: number) => {
    setClipboardHistory((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, isStarred: item.isStarred ? 0 : 1 } : item
      )
    );
    setSelectedItem((prev) =>
      prev && prev.id === id ? { ...prev, isStarred: prev.isStarred ? 0 : 1 } : prev
    );
    window.clipboardAPI.toggleStar(id).catch(() => {
      setClipboardHistory((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, isStarred: item.isStarred ? 0 : 1 } : item
        )
      );
    });
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const inInput = (e.target as HTMLElement)?.tagName === 'INPUT';

      // Cmd/Ctrl+F or "/" (when not in an input) → focus search
      if ((e.key === 'f' && (e.metaKey || e.ctrlKey)) || (e.key === '/' && !inInput)) {
        e.preventDefault();
        searchBarRef.current?.focus();
        return;
      }

      if (e.key === 'Escape') {
        e.preventDefault();
        if (searchInput) {
          setSearchInput('');
          searchBarRef.current?.blur();
          return;
        }
        if (inInput) {
          searchBarRef.current?.blur();
          return;
        }
        window.clipboardAPI.hideWindow?.();
        return;
      }
      if (clipboardHistory.length === 0) return;

      const idx = selectedItem
        ? clipboardHistory.findIndex((i) => i.id === selectedItem.id)
        : -1;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (inInput) {
          searchBarRef.current?.blur();
          setSelectedItem(clipboardHistory[0] ?? null);
        } else {
          const next = idx < 0 ? 0 : Math.min(clipboardHistory.length - 1, idx + 1);
          setSelectedItem(clipboardHistory[next]);
        }
      } else if (e.key === 'ArrowUp' && !inInput) {
        e.preventDefault();
        const next = idx <= 0 ? 0 : idx - 1;
        setSelectedItem(clipboardHistory[next]);
      } else if (e.key === 'Enter') {
        const t = selectedItem ?? clipboardHistory[0];
        if (t) {
          e.preventDefault();
          pasteItem(t);
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [clipboardHistory, selectedItem, pasteItem, searchInput]);

  const historyRef = useRef(clipboardHistory);
  useEffect(() => {
    historyRef.current = clipboardHistory;
  }, [clipboardHistory]);

  useEffect(() => {
    return window.clipboardAPI.onWindowShown(() => {
      setSearchInput('');
      searchBarRef.current?.blur();
      const first = historyRef.current[0];
      if (first) setSelectedItem(first);
    });
  }, []);

  return (
    <div className="flex flex-col h-screen w-screen bg-[color:var(--bg)] text-[color:var(--fg)] overflow-hidden rounded-xl border border-[color:var(--border)]">
      <header
        className="shrink-0 flex items-center gap-3 px-4 h-11 border-b border-[color:var(--border)] select-none"
        style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
      >
        <div className="flex items-center gap-2 pl-16 shrink-0">
          <span className="text-[13px] font-semibold tracking-tight text-[color:var(--fg)]">
            Clipboard
          </span>
          <span className="text-[11px] text-[color:var(--fg-subtle)] tabular-nums">
            {clipboardHistory.length} {clipboardHistory.length === 1 ? 'item' : 'items'}
          </span>
        </div>
        <SearchBar ref={searchBarRef} value={searchInput} onChange={setSearchInput} />
      </header>
      <div className="flex-1 min-h-0 flex">
        <HistorySidebar
          history={clipboardHistory}
          selectedItem={selectedItem}
          onSelectItem={setSelectedItem}
          onLoadMore={loadMore}
          onToggleStar={toggleStar}
          hasMore={hasMore}
          isLoadingMore={isLoadingMore}
          mode={mode}
          searchQuery={searchQuery}
        />
        <ContentDisplay selectedItem={selectedItem} />
      </div>
    </div>
  );
}

export default App;
