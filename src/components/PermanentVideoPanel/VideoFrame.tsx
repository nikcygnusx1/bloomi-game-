import React, { useState, useEffect } from 'react';
import { VIDEO_PANEL_SOURCES } from '../../config/videoSources';
import { FeedOverlay } from './FeedOverlay';
import { SimState } from '../../types';
import styles from './styles.module.css';

interface VideoFrameProps {
  feedId: 'CERN' | 'MRKTS' | 'INTEL' | 'ATMO';
  state: SimState | null;
  colorGrade: 'default' | 'flood' | 'heat';
  isNoiseFlash: boolean;
  isFeedDegraded: boolean;
  energySpikeValue: number;
}

const FEED_KEY_MAP: Record<'CERN' | 'MRKTS' | 'INTEL' | 'ATMO', keyof typeof VIDEO_PANEL_SOURCES> = {
  CERN: 'cern',
  MRKTS: 'markets',
  INTEL: 'intel',
  ATMO: 'atmo',
};

export function VideoFrame({
  feedId,
  state,
  colorGrade,
  isNoiseFlash,
  isFeedDegraded,
  energySpikeValue,
}: VideoFrameProps) {
  const [playTriggered, setPlayTriggered] = useState(false);
  const [hasError, setHasError] = useState(false);

  const configKey = FEED_KEY_MAP[feedId];
  const videoId = VIDEO_PANEL_SOURCES[configKey];

  // We consider it offline if the video ID is empty or placeholder 'YOUTUBE_VIDEO_ID_HERE'
  const isOffline = !videoId || videoId.trim() === '' || videoId === 'YOUTUBE_VIDEO_ID_HERE';

  // Fallback trigger for browser gesture logic if needed
  useEffect(() => {
    // Reset error on feed change standard
    setHasError(false);
  }, [feedId]);

  const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&controls=0&showinfo=0&rel=0&iv_load_policy=3&modestbranding=1&loop=1&playlist=${videoId}&start=0`;

  return (
    <div className={styles.videoArea}>
      {!isOffline && !hasError ? (
        <div className="absolute inset-0 w-full h-full">
          {/* Muted auto-looping chromeless YouTube iframe */}
          <iframe
            className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none border-none scale-[1.05]"
            src={embedUrl}
            title="Sovereign Broadcast Link"
            allow="autoplay; encrypted-media"
            onError={() => setHasError(true)}
            style={{ pointerEvents: 'none' }}
          />

          {/* Interactive Play Unlock Overlay (In case autoplay gets blocked) */}
          {!playTriggered && (
            <div 
              className="absolute inset-0 flex items-center justify-center bg-black/60 cursor-pointer z-10 hover:bg-black/40 transition-colors"
              onClick={() => setPlayTriggered(true)}
              title="Click to anchor audio clearance"
            >
              <div className="px-3 py-1 border border-[#ff6f00] bg-[#030304]/90 text-stone-100 font-mono text-[8px] tracking-widest rounded flex items-center gap-1">
                <span>[ UNCOUPLE SIGNAL ]</span>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Classified SIGNAL OFFLINE retro layout */
        <div className={styles.offlineScreen}>
          <div className={`${styles.offlineIcon} font-extrabold`}>◈  NO CARRIER</div>
          <div className="text-[10px] font-black uppercase tracking-wider text-rose-500">FEED_STATUS: OFFLINE</div>
          <div className={styles.offlineText}>
            THE CLASSIFIED RECEIVER CHANNEL HAS NOT BEEN DEPLOYED.<br />
            SET VIDEO IDENTIFIERS IN <code className="text-[#00ffff] block mt-0.5">/src/config/videoSources.ts</code>.
          </div>
        </div>
      )}

      {/* Layer overlays: scanning lines, brackets, bottom bar */}
      <FeedOverlay
        feedId={feedId}
        state={state}
        colorGrade={colorGrade}
        isNoiseFlash={isNoiseFlash}
        isFeedDegraded={isFeedDegraded}
        energySpikeValue={energySpikeValue}
      />
    </div>
  );
}
