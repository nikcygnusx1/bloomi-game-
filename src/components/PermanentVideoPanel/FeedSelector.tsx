import React from 'react';
import { playSyntheticSound } from '../../utils/audio';
import styles from './styles.module.css';

interface FeedSelectorProps {
  activeFeedId: 'CERN' | 'MRKTS' | 'INTEL' | 'ATMO';
  onChangeFeed: (feedId: 'CERN' | 'MRKTS' | 'INTEL' | 'ATMO') => void;
}

export function FeedSelector({ activeFeedId, onChangeFeed }: FeedSelectorProps) {
  const feeds: { id: 'CERN' | 'MRKTS' | 'INTEL' | 'ATMO'; label: string }[] = [
    { id: 'CERN', label: 'CERN' },
    { id: 'MRKTS', label: 'MRKTS' },
    { id: 'INTEL', label: 'INTEL' },
    { id: 'ATMO', label: 'ATMO' },
  ];

  const handleSelect = (id: 'CERN' | 'MRKTS' | 'INTEL' | 'ATMO') => {
    if (activeFeedId !== id) {
      try {
        playSyntheticSound('tick');
      } catch (e) {
        // Safe fallback if audio context issues occur
      }
      onChangeFeed(id);
    }
  };

  return (
    <div className={styles.feedSelector}>
      {feeds.map((feed) => {
        const isActive = activeFeedId === feed.id;
        return (
          <button
            key={feed.id}
            onClick={() => handleSelect(feed.id)}
            className={`${styles.pillButton} ${isActive ? styles.pillActive : styles.pillInactive}`}
          >
            [{feed.label}]
          </button>
        );
      })}
    </div>
  );
}
