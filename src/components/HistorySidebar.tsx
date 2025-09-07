import { ClipboardHistory } from '../types';
import { Copy, Check } from 'lucide-react';

interface HistorySidebarProps {
  history: ClipboardHistory[];
  selectedItem: ClipboardHistory | null;
  copiedId: number | null;
  onSelectItem: (item: ClipboardHistory) => void;
  onCopyItem: (e: React.MouseEvent, item: ClipboardHistory) => void;
}

const truncate = (str: string, length: number) => {
  const singleLine = str.replace(/\n/g, ' '); // replace newlines with spaces
  return singleLine.length > length
    ? singleLine.substring(0, length) + '...'
    : singleLine;
};

export function HistorySidebar({
  history,
  selectedItem,
  copiedId,
  onSelectItem,
  onCopyItem,
}: HistorySidebarProps) {
  return (
    <aside
      className="w-1/3 h-screen min-h-0 bg-gray-800 border-r border-gray-700 flex flex-col overflow-y-auto overflow-x-hidden pr-0"
    >
      <h2 className="text-xl font-bold p-4 border-b border-gray-700">
        History
      </h2>
      <ul className="flex-1 min-h-0 overflow-y-auto px-2 py-2 space-y-2">
        {history.map((item) => (
          <li
            key={item.id}
            onClick={() => onSelectItem(item)}
            className={`group flex items-center justify-between p-2 rounded cursor-pointer ${selectedItem?.id === item.id
              ? 'bg-gray-700'
              : 'hover:bg-gray-700'
              }`}
          >
            <p className="font-mono text-sm flex-grow pr-2 whitespace-nowrap overflow-hidden text-ellipsis">
              {truncate(item.content, 30)}
            </p>
            <button
              onClick={(e) => onCopyItem(e, item)}
              className="p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            >
              {copiedId === item.id ? (
                <Check className="w-4 h-4 text-green-400" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
}
