import { useState, useEffect } from 'react';
import './App.css';
import { ClipboardHistory } from './types';
import { HistorySidebar } from './components/HistorySidebar';
import { ContentDisplay } from './components/ContentDisplay';

function App() {
  const [clipboardHistory, setClipboardHistory] = useState<ClipboardHistory[]>([]);
  const [selectedItem, setSelectedItem] = useState<ClipboardHistory | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  useEffect(() => {
    window.clipboardAPI.getClipboardHistory().then(history => {
      setClipboardHistory(history);
      if (history.length > 0) {
        setSelectedItem(history[0]);
      }
    });

    window.clipboardAPI.onClipboardChanged(newItem => {
      setClipboardHistory(prevHistory => [newItem, ...prevHistory]);
    });
  }, []);

  const handleCopy = (e: React.MouseEvent, item: ClipboardHistory) => {
    e.stopPropagation(); // Prevent the selection from changing
    navigator.clipboard.writeText(item.content).then(() => {
      setCopiedId(item.id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      <HistorySidebar
        history={clipboardHistory}
        selectedItem={selectedItem}
        copiedId={copiedId}
        onSelectItem={setSelectedItem}
        onCopyItem={handleCopy}
      />
      <ContentDisplay selectedItem={selectedItem} />
    </div>
  );
}

export default App;