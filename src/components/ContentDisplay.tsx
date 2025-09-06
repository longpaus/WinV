import { ClipboardHistory } from '../types';

interface ContentDisplayProps {
  selectedItem: ClipboardHistory | null;
}

export function ContentDisplay({ selectedItem }: ContentDisplayProps) {
  if (!selectedItem) {
    return (
      <main className="w-2/3 p-4">
        <div className="flex items-center justify-center h-full">
          <p className="text-gray-500">Select an item from the history</p>
        </div>
      </main>
    );
  }

  return (
    <main className="w-2/3 p-4">
      <div>
        <h1 className="text-2xl font-bold mb-4">Content</h1>
        <div className="bg-gray-800 p-4 rounded-lg">
          <pre className="text-gray-300 whitespace-pre-wrap font-mono">{selectedItem.content}</pre>
          <p className="text-sm text-gray-500 mt-4">{new Date(selectedItem.copyTime).toLocaleString()}</p>
        </div>
      </div>
    </main>
  );
}
