import { useEffect, useRef } from 'react';
import { ClipboardHistory } from '../types';

interface HistorySidebarProps {
  history: ClipboardHistory[];
  selectedItem: ClipboardHistory | null;
  onSelectItem: (item: ClipboardHistory) => void;
}

function formatRelative(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const diff = Date.now() - then;
  const s = Math.round(diff / 1000);
  if (s < 10) return 'just now';
  if (s < 60) return `${s}s ago`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}

export function HistorySidebar({
  history,
  selectedItem,
  onSelectItem,
}: HistorySidebarProps) {
  const selectedRef = useRef<HTMLLIElement | null>(null);

  useEffect(() => {
    selectedRef.current?.scrollIntoView({ block: 'nearest' });
  }, [selectedItem?.id]);

  if (history.length === 0) {
    return (
      <aside className="w-[38%] h-full flex flex-col border-r border-[color:var(--border)]">
        <div className="flex-1 flex items-center justify-center px-6">
          <p className="text-xs text-[color:var(--fg-subtle)] text-center leading-relaxed">
            Nothing copied yet.
            <br />
            Copy something and it will appear here.
          </p>
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-[38%] h-full flex flex-col min-h-0 border-r border-[color:var(--border)]">
      <div className="px-4 pt-3 pb-2">
        <p className="text-[10px] font-semibold tracking-[0.14em] uppercase text-[color:var(--fg-subtle)]">
          Recent
        </p>
      </div>
      <ul className="flex-1 min-h-0 overflow-y-auto px-2 pb-2 space-y-0.5">
        {history.map((item) => {
          const isSelected = selectedItem?.id === item.id;
          return (
            <li
              key={item.id}
              ref={isSelected ? selectedRef : null}
              onClick={() => onSelectItem(item)}
              title={new Date(item.copyTime).toLocaleString()}
              className={`relative cursor-pointer rounded-[10px] px-3 py-2.5 transition-colors ${
                isSelected
                  ? 'bg-[color:var(--accent-bg)]'
                  : 'hover:bg-[color:var(--bg-hover)]'
              }`}
            >
              {isSelected && (
                <span
                  aria-hidden
                  className="absolute left-0 top-2 bottom-2 w-[3px] rounded-full bg-[color:var(--accent)]"
                />
              )}
              <p
                className={`line-clamp-2 text-[13px] leading-snug ${
                  isSelected
                    ? 'text-[color:var(--fg)]'
                    : 'text-[color:var(--fg)]/90'
                }`}
              >
                {item.content.trim() || '(empty)'}
              </p>
              <p className="mt-1 text-[11px] text-[color:var(--fg-subtle)]">
                {formatRelative(item.copyTime)}
              </p>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
