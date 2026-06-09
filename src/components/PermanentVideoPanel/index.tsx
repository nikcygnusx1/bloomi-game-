import React, { useState, useEffect, useLayoutEffect, useCallback } from 'react';
import { useGameEvents } from './useGameEvents';
import { VideoFrame } from './VideoFrame';
import { FeedSelector } from './FeedSelector';
import { SimState } from '../../types';
import { playSyntheticSound } from '../../utils/audio';
import styles from './styles.module.css';

interface PermanentVideoPanelProps {
  state?: SimState | null;
}

const FEED_NAMES: Record<'CERN' | 'MRKTS' | 'INTEL' | 'ATMO', string> = {
  CERN: 'CERN_LHC_TELEMETRY',
  MRKTS: 'SOVEREIGN_CDS_SPREADS',
  INTEL: 'PALANTIR_GRAPH_NET',
  ATMO: 'BLACK_RAIN_METEOROLOGY',
};

export function PermanentVideoPanel({ state = null }: PermanentVideoPanelProps) {
  const [activeFeedId, setActiveFeedId] = useState<'CERN' | 'MRKTS' | 'INTEL' | 'ATMO'>('CERN');
  const [screenTooNarrow, setScreenTooNarrow] = useState(false);

  // Read persisted expanded/collapsed state from sessionStorage
  const [isExpanded, setIsExpanded] = useState(() => {
    const persisted = sessionStorage.getItem('bloomi_vidpanel_state');
    if (persisted === 'collapsed') return false;
    return true; // Default expanded
  });

  // Track screen size to restrict expansion on narrow layouts
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

  // Set sessionStorage whenever isExpanded changes, except when forced narrow
  const toggleExpanded = useCallback((e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation(); // Avoid double toggles from overlay clicks
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

  // Backtick keyboard trigger listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Avoid intercepting during input/textfields focus
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target as HTMLElement).isContentEditable
      ) {
        return;
      }

      if (e.key === '`' || e.code === 'Backquote') {
        if (screenTooNarrow) return; // Disallow expand if narrow
        
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
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [screenTooNarrow]);

  // Callback to handle automatic feeds switching by severe system events
  const handleAutoSwitchFeed = useCallback((feedId: 'CERN' | 'MRKTS' | 'INTEL' | 'ATMO') => {
    setActiveFeedId(feedId);
  }, []);

  // Listen to game events logic hook
  const {
    colorGrade,
    isNoiseFlash,
    isFeedDegraded,
    pulseRedBorder,
    energySpikeValue,
  } = useGameEvents({
    state,
    onAutoSwitchFeed: handleAutoSwitchFeed,
  });

  // Cycle to next feed logic
  const handleCycleFeed = (e: React.MouseEvent) => {
    e.stopPropagation(); // Stop event bubbling to header click
    const list: ('CERN' | 'MRKTS' | 'INTEL' | 'ATMO')[] = ['CERN', 'MRKTS', 'INTEL', 'ATMO'];
    const curIdx = list.indexOf(activeFeedId);
    const nextIdx = (curIdx + 1) % list.length;
    
    try {
      playSyntheticSound('click');
    } catch (err) {}
    
    setActiveFeedId(list[nextIdx]);
  };

  // Determine actual rendered layout heights
  const containerHeightClass = isExpanded ? styles.expanded : styles.collapsed;
  const redBorderClass = pulseRedBorder ? styles.glowing : '';

  return (
    <div className={`${styles.panel} ${containerHeightClass} ${redBorderClass}`} id="bloomi_permanent_video_panel">
      {/* 28px Header Bar */}
      <div className={styles.header} onClick={() => !screenTooNarrow && toggleExpanded()}>
        <div className={styles.titleSection}>
          <div className={styles.liveDot} />
          <div className={styles.liveText}>LIVE</div>
          <div className={styles.feedName}>{FEED_NAMES[activeFeedId]}</div>
        </div>

        <div className={styles.controls}>
          {/* Next channel button [▶] */}
          <button 
            className={styles.controlBtn} 
            onClick={handleCycleFeed} 
            title="Cycle sovereign intelligence stream"
          >
            [▶]
          </button>
          
          {/* Collapse/Expand button [━━] */}
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

      {/* Main expanded contents (always mounted in DOM so iframe keeps running when collapsed) */}
      <VideoFrame
        feedId={activeFeedId}
        state={state}
        colorGrade={colorGrade}
        isNoiseFlash={isNoiseFlash}
        isFeedDegraded={isFeedDegraded}
        energySpikeValue={energySpikeValue}
      />

      <FeedSelector
        activeFeedId={activeFeedId}
        onChangeFeed={(id) => setActiveFeedId(id)}
      />

    </div>
  );
}
export default PermanentVideoPanel;
