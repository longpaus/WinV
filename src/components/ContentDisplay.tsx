import { useState } from 'react';
import { ClipboardHistory } from '../types';
import { ClipboardList, Copy, Check } from 'lucide-react';

interface ContentDisplayProps {
  selectedItem: ClipboardHistory | null;
}

function formatAbsolute(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export function ContentDisplay({ selectedItem }: ContentDisplayProps) {
  const [copied, setCopied] = useState(false);

  if (!selectedItem) {
    return (
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-3 text-[color:var(--fg-subtle)]">
          <ClipboardList className="w-8 h-8" strokeWidth={1.5} />
          <p className="text-sm">Select an item to preview it</p>
        </div>
      </main>
    );
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(selectedItem.content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    });
  };

  const charCount = selectedItem.content.length;
  const lineCount = selectedItem.content.split('\n').length;

  return (
    <main className="flex-1 min-w-0 flex flex-col h-full">
      <div className="flex-1 min-h-0 overflow-auto px-6 pt-4 pb-3">
        <pre className="text-[13px] leading-relaxed text-[color:var(--fg)] whitespace-pre-wrap break-words font-[var(--font-mono)]">
          {selectedItem.content}
        </pre>
      </div>
      <div className="shrink-0 flex items-center justify-between gap-3 px-6 py-3 border-t border-[color:var(--border)]">
        <div className="flex items-center gap-3 text-[11px] text-[color:var(--fg-subtle)] tabular-nums min-w-0">
          <span className="truncate">{formatAbsolute(selectedItem.copyTime)}</span>
          <span className="opacity-50">·</span>
          <span className="shrink-0">
            {charCount.toLocaleString()} chars · {lineCount} line{lineCount === 1 ? '' : 's'}
          </span>
        </div>
        <button
          onClick={handleCopy}
          className={`shrink-0 inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[12px] font-medium transition-colors cursor-pointer ${
            copied
              ? 'bg-[color:var(--accent-bg)] text-[color:var(--accent)]'
              : 'bg-[color:var(--bg-hover)] text-[color:var(--fg)] hover:bg-[color:var(--border-strong)]'
          }`}
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5" />
              Copied
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              Copy
            </>
          )}
        </button>
      </div>
    </main>
  );
}
