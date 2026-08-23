import { useState } from 'react';
import { useFeeds } from './hooks/useFeeds';
import { useItems } from './hooks/useItems';
import { Sidebar } from './components/Sidebar';
import { ItemList } from './components/ItemList';
import { ItemReader } from './components/ItemReader';
import { DigestView } from './components/DigestView';
import { api } from './api';
import type { Item } from './types';

export default function App() {
  const { feeds, addFeed, removeFeed, refreshAll } = useFeeds();
  const [view, setView] = useState<'reader' | 'digest'>('reader');
  const [selectedFeedId, setSelectedFeedId] = useState<number | null>(null);
  const [query, setQuery] = useState('');
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);

  const { items, loading, setItems } = useItems({ feedId: selectedFeedId, query, unreadOnly }, refreshToken);

  const handleSelectItem = (item: Item) => {
    setSelectedItem(item);
    if (item.is_read === 0) {
      handleMarkRead(item.id, true);
    }
  };

  const handleMarkRead = (id: number, isRead: boolean) => {
    api.markRead(id, isRead).then(() => {
      setItems((prev) => prev.map((i) => (i.id === id ? { ...i, is_read: isRead ? 1 : 0 } : i)));
      setSelectedItem((prev) => (prev && prev.id === id ? { ...prev, is_read: isRead ? 1 : 0 } : prev));
    });
  };

  const handleRefreshAll = async () => {
    await refreshAll();
    setRefreshToken((n) => n + 1);
  };

  return (
    <div className="app">
      <Sidebar
        feeds={feeds}
        selectedFeedId={selectedFeedId}
        onSelectFeed={setSelectedFeedId}
        onAddFeed={addFeed}
        onRemoveFeed={removeFeed}
        onRefreshAll={handleRefreshAll}
        view={view}
        onChangeView={setView}
      />
      {view === 'reader' ? (
        <>
          <ItemList
            items={items}
            loading={loading}
            selectedId={selectedItem?.id ?? null}
            onSelect={handleSelectItem}
            query={query}
            onQueryChange={setQuery}
            unreadOnly={unreadOnly}
            onUnreadOnlyChange={setUnreadOnly}
          />
          <ItemReader item={selectedItem} onMarkRead={handleMarkRead} />
        </>
      ) : (
        <DigestView />
      )}
    </div>
  );
}
