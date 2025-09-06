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
  return str.length > length ? str.substring(0, length) + '...' : str;
};

export function HistorySidebar({ history, selectedItem, copiedId, onSelectItem, onCopyItem }: HistorySidebarProps) {
  return (
    <aside className="w-1/3 bg-gray-800 p-4 overflow-y-auto">
      <h2 className="text-xl font-bold mb-4">History</h2>
      <div className="flex flex-col gap-1">
        {history.map((item) => (
          <div
            key={item.id}
            onClick={() => onSelectItem(item)}
            className={`group flex items-center justify-between p-2 rounded cursor-pointer ${
              selectedItem?.id === item.id ? 'bg-gray-700' : 'hover:bg-gray-700'
            }`}>
            <p className="font-mono text-sm flex-grow pr-2">{truncate(item.content, 30)}</p>
            <button
              onClick={(e) => onCopyItem(e, item)}
              className="p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
              {copiedId === item.id ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        ))}
      </div>
    </aside>
  );
}
