import { useImperativeHandle, useRef, forwardRef } from 'react';

interface SearchBarProps {
  value: string;
  onChange: (next: string) => void;
}

export interface SearchBarHandle {
  focus: () => void;
  blur: () => void;
}

export const SearchBar = forwardRef<SearchBarHandle, SearchBarProps>(
  function SearchBar({ value, onChange }, ref) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  useImperativeHandle(ref, () => ({
    focus: () => inputRef.current?.focus(),
    blur: () => inputRef.current?.blur(),
  }));

  return (
    <div
      className="flex items-center gap-2 flex-1 h-7 px-2.5 rounded-md border border-[color:var(--border)] bg-[color:var(--bg-elev)] focus-within:border-[color:var(--accent)]"
      style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
    >
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[color:var(--fg-subtle)] shrink-0">
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.3-4.3" />
      </svg>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search clipboard..."
        className="flex-1 bg-transparent outline-none text-[12px] text-[color:var(--fg)] placeholder:text-[color:var(--fg-subtle)]"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="Clear search"
          className="shrink-0 text-[color:var(--fg-subtle)] hover:text-[color:var(--fg)]"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </button>
      )}
    </div>
  );
});
