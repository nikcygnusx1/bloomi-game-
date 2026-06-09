import React, { useState, useEffect, useLayoutEffect, useCallback } from 'react';
import { useGameEvents } from './useGameEvents';
import { VideoFrame } from './VideoFrame';
import { FeedSelector } from './FeedSelector';
import { SimState } from '../../types';
import { playSyntheticSound } from '../../utils/audio';
import { QUAD_FEEDS, FeedConfig } from '../../config/videoSources';
import styles from './styles.module.css';

interface PermanentVideoPanelProps {
  state?: SimState | null;
}

export function PermanentVideoPanel({ state = null }: PermanentVideoPanelProps) {
  const [focusedFeedId, setFocusedFeedId] = useState<string | null>(null);
  const [screenTooNarrow, setScreenTooNarrow] = useState(false);

  // Read persisted expanded/collapsed state from sessionStorage
  const [isExpanded, setIsExpanded] = useState(() => {
    const persisted = sessionStorage.getItem('bloomi_vidpanel_state');
    if (persisted === 'collapsed') return false;
    return true; // Default expanded
  });

  // Track screen size to restrict expansion on narrow layouts (< 1100px)
  useLayoutEffect(() => {
    const checkWidth = () => {
      const isNarrow = window.innerWidth < 1100;
      setScreenTooNarrow(isNarrow);
      if (isNarrow) {
        setIsExpanded(false);
      }
    };
    
    checkWidth();
    window.addEventListener('resize', checkWidth);
    return () => window.removeEventListener('resize', checkWidth);
  }, []);

  // Minimize or maximize state changer
  const toggleExpanded = useCallback((e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation(); // Avoid double logs on clicking controls
    }
    if (screenTooNarrow) return;

    try {
      playSyntheticSound('click');
    } catch (err) {}

    setIsExpanded((prev) => {
      const next = !prev;
      sessionStorage.setItem('bloomi_vidpanel_state', next ? 'expanded' : 'collapsed');
      return next;
    });
  }, [screenTooNarrow]);

  // Keyboard listeners: backtick toggle, Escape key exits focus mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target as HTMLElement).isContentEditable
      ) {
        return;
      }

      // Backtick code triggers collapse/expand
      if (e.key === '`' || e.code === 'Backquote') {
        if (screenTooNarrow) return;
        e.preventDefault();
        setIsExpanded((prev) => {
          const next = !prev;
          sessionStorage.setItem('bloomi_vidpanel_state', next ? 'expanded' : 'collapsed');
          try {
            playSyntheticSound('click');
          } catch (err) {}
          return next;
        });
      }

      // Escape code triggers exit Focus Mode
      if (e.key === 'Escape') {
        setFocusedFeedId((prev) => {
          if (prev !== null) {
            try {
              playSyntheticSound('click');
            } catch (err) {}
            return null;
          }
          return null;
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [screenTooNarrow]);

  // Hook game weather, defaults, reactor spikes and threats simultaneously
  const {
    colorGrade,
    isNoiseFlash,
    isFeedDegraded,
    sovereignDefault,
    colliderArmed,
    bunkerThreat,
  } = useGameEvents(state);

  // Focus specific stream on mouse clicks
  const handleCellClick = (id: string) => {
    if (focusedFeedId === id) return; // Already enlarged
    try {
      playSyntheticSound('tick');
    } catch (err) {}
    setFocusedFeedId(id);
  };

  // Exit focus view handler
  const handleExitFocus = (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      playSyntheticSound('click');
    } catch (err) {}
    setFocusedFeedId(null);
  };

  // State mapping of layout transitions using calculated relative percentages
  const getCellCoordinates = (index: number, feedId: string) => {
    if (focusedFeedId === null) {
      // Normal multi-feed 2x2 layout positioning coordinates
      const positions = [
        { left: '0%', top: '0%', width: 'calc(50% - 1px)', height: 'calc(50% - 1px)' },
        { left: 'calc(50% + 1px)', top: '0%', width: 'calc(50% - 1px)', height: 'calc(50% - 1px)' },
        { left: '0%', top: 'calc(50% + 1px)', width: 'calc(50% - 1px)', height: 'calc(50% - 1px)' },
        { left: 'calc(50% + 1px)', top: 'calc(50% + 1px)', width: 'calc(50% - 1px)', height: 'calc(50% - 1px)' },
      ];
      return positions[index];
    } else if (focusedFeedId === feedId) {
      // Focused large cell taking up 75% wide, 100% tall column
      return {
        left: '0%',
        top: '0%',
        width: 'calc(75% - 2px)',
        height: '100%',
      };
    } else {
      // Non-focused columns stacked vertically on the right side
      const remainingFeeds = QUAD_FEEDS.filter(f => f.id !== focusedFeedId);
      const stackIdx = remainingFeeds.findIndex(f => f.id === feedId);
      
      const topOffsetPercent = stackIdx * 33.33;
      return {
        left: 'calc(75% + 1px)',
        top: `calc(${topOffsetPercent}% + ${stackIdx}px)`,
        width: 'calc(25% - 1px)',
        height: 'calc(33.33% - 2px)',
      };
    }
  };

  const containerHeightClass = isExpanded ? styles.expanded : styles.collapsed;
  const globalPulseClass = sovereignDefault ? styles.glowing : '';

  return (
    <div
      className={`${styles.panel} ${containerHeightClass} ${globalPulseClass}`}
      id="bloomi_permanent_video_panel"
    >
      {/* 28px Header Bar */}
      <div className={styles.header} onClick={() => !screenTooNarrow && toggleExpanded()}>
        <div className={styles.titleSection}>
          <div className={styles.liveDot} />
          <div className={styles.liveText}>● LIVE</div>
          <div className={styles.feedName}>
            SOVEREIGN_FEED_ARRAY [QUAD ▪▪▪▪]
          </div>
        </div>

        <div className={styles.controls}>
          {/* Collapse/Expand action buttons */}
          {!screenTooNarrow && (
            <button
              className={styles.controlBtn}
              onClick={toggleExpanded}
              title={isExpanded ? "Collapse panel" : "Expand panel"}
            >
              {isExpanded ? '[━━]' : '[⤢]'}
            </button>
          )}
        </div>
      </div>

      {/* Main expanded video contents - kept in DOM so background youtube audio keeps flowing */}
      <div className={styles.gridContainer}>
        {QUAD_FEEDS.map((feed, index) => {
          const isFocused = focusedFeedId === feed.id;
          const coordinates = getCellCoordinates(index, feed.id);

          return (
            <VideoFrame
              key={feed.id}
              feed={feed}
              state={state}
              isFocused={isFocused}
              colorGrade={colorGrade}
              isNoiseFlash={isNoiseFlash}
              isFeedDegraded={isFeedDegraded}
              sovereignDefault={sovereignDefault}
              colliderArmed={colliderArmed}
              bunkerThreat={bunkerThreat}
              onFocus={() => handleCellClick(feed.id)}
              style={coordinates}
            />
          );
        })}

        {/* Thin overlay action button for returning back to regular Quad view */}
        {focusedFeedId !== null && (
          <button
            className={styles.backBtn}
            onClick={handleExitFocus}
            title="Return to Quad Feed stream"
          >
            [◀ QUAD]
          </button>
        )}
      </div>

      {/* Retro compatibility structure to prevent typing errors elsewhere */}
      <FeedSelector />
    </div>
  );
}

export default PermanentVideoPanel;
