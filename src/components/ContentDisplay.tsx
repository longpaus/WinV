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
      <h1 className="text-2xl font-bold mb-4">Content</h1>

      {/* Fixed 400px height container */}
      <div className="bg-gray-800 p-4 rounded-lg flex flex-col h-[410px]">
        {/* Scrollable content area */}
        <div className="flex-1 overflow-auto">
          <pre className="text-gray-300 whitespace-pre-wrap font-mono">
            {selectedItem.content}
          </pre>
        </div>

        {/* Fixed timestamp */}
        <p className="text-sm text-gray-500 mt-4 shrink-0">
          {new Date(selectedItem.copyTime).toLocaleString()}
        </p>
      </div>
    </main>
  );
}
