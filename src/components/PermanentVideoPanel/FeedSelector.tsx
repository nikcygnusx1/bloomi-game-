import React from 'react';

interface FeedSelectorProps {
  activeFeedId?: any;
  onChangeFeed?: (id: any) => void;
}

export function FeedSelector({ activeFeedId, onChangeFeed }: FeedSelectorProps) {
  // Return null because inside the upgraded 4-feed surveillance panel all feeds are rendered simultaneously!
  return null;
}
export default FeedSelector;
