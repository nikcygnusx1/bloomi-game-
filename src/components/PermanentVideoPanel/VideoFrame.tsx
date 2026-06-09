import React, { useState, useEffect } from 'react';
import { FeedConfig } from '../../config/videoSources';
import { FeedOverlay } from './FeedOverlay';
import { SimState } from '../../types';
import styles from './styles.module.css';

interface VideoFrameProps {
  feed: FeedConfig;
  state: SimState | null;
  isFocused: boolean;
  colorGrade: 'default' | 'flood' | 'heat';
  isNoiseFlash: boolean;
  isFeedDegraded: boolean;
  sovereignDefault: boolean;
  colliderArmed: boolean;
  bunkerThreat: boolean;
  onFocus: () => void;
  style?: React.CSSProperties;
}

export function VideoFrame({
  feed,
  state,
  isFocused,
  colorGrade,
  isNoiseFlash,
  isFeedDegraded,
  sovereignDefault,
  colliderArmed,
  bunkerThreat,
  onFocus,
  style,
}: VideoFrameProps) {
  const [isLiveActive, setIsLiveActive] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Auto-recovery: If live URL fails or iframe errors out, fallback to archived loop automatically
  const handleIframeError = () => {
    setHasError(true);
    setIsLiveActive(false);
  };

  // Determine source URL based on [LIVE] preference and error status
  const embedUrl = (() => {
    if (isLiveActive && !hasError && feed.liveUrl) {
      // For channel live streams, omit loop parameter as specified in Section 8
      return `${feed.liveUrl}&autoplay=1&mute=1&controls=0&showinfo=0&rel=0&iv_load_policy=3&modestbranding=1&enablejsapi=0`;
    } else {
      // Fallback video loops forever
      return `https://www.youtube.com/embed/${feed.fallbackVideoId}?autoplay=1&mute=1&controls=0&rel=0&loop=1&playlist=${feed.fallbackVideoId}`;
    }
  })();

  // Whether this specific feed is classified or has no playable identifier
  const isSovereignOffline = !feed.fallbackVideoId || feed.fallbackVideoId.trim() === '';

  // Handle toggling live stream state
  const handleToggleLive = (e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid triggering parent cell Focus Mode
    setIsLiveActive((prev) => !prev);
  };

  return (
    <div
      className={`${styles.videoCell} ${isFocused ? styles.videoCellFocused : ''} ${
        feed.id === 'geopolitical' && sovereignDefault ? styles.sovereignStressBorder : ''
      }`}
      style={style}
      onClick={onFocus}
    >
      {/* 1. Video render layer */}
      <div className={styles.videoIframeWrapper}>
        {!isSovereignOffline ? (
          <iframe
            className="absolute inset-0 w-full h-full object-cover select-none border-none scale-[1.05]"
            src={embedUrl}
            title={`Bloomi Intelligence Feed: ${feed.label}`}
            allow="autoplay; encrypted-media"
            onError={handleIframeError}
            style={{ pointerEvents: 'none' }}
          />
        ) : (
          /* SECTION 4 - SIGNAL_OFFLINE state */
          <div className={styles.offlineScreen}>
            <span className="text-amber-500 text-lg">◈</span>
            <span className={styles.offlineLabel}>NO CARRIER</span>
            <span className={styles.offlineSubtext}>{feed.label}</span>
          </div>
        )}
      </div>

      {/* 2. Interactive [LIVE] Toggle button at upper right (except if completely offline) */}
      {!isSovereignOffline && (
        <button
          className={`${styles.cellActionBtn} ${isLiveActive ? styles.cellActionBtnActive : ''}`}
          onClick={handleToggleLive}
          title={isLiveActive ? "Showing LIVE Stream. Click to show Fallback Video." : "Click to attempt Live stream"}
        >
          {isLiveActive ? '[LIVE_ON]' : '[LIVE]'}
        </button>
      )}

      {/* 3. Feed overlays (Brackets, Labels, Scanlines, Statuses, Audio flash, atmo grades) */}
      <FeedOverlay
        feed={feed}
        state={state}
        isFocused={isFocused}
        colorGrade={colorGrade}
        isNoiseFlash={isNoiseFlash}
        isFeedDegraded={isFeedDegraded}
        sovereignDefault={sovereignDefault}
        colliderArmed={colliderArmed}
        bunkerThreat={bunkerThreat}
        isLiveActive={isLiveActive}
      />
    </div>
  );
}
export default VideoFrame;
