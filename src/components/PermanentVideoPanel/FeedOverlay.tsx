import React, { useMemo } from 'react';
import { SimState } from '../../types';
import styles from './styles.module.css';

interface FeedOverlayProps {
  feedId: 'CERN' | 'MRKTS' | 'INTEL' | 'ATMO';
  state: SimState | null;
  colorGrade: 'default' | 'flood' | 'heat';
  isNoiseFlash: boolean;
  isFeedDegraded: boolean;
  energySpikeValue: number;
}

export function FeedOverlay({
  feedId,
  state,
  colorGrade,
  isNoiseFlash,
  isFeedDegraded,
  energySpikeValue,
}: FeedOverlayProps) {
  // Compute portfolio AUM
  const portfolioAUM = useMemo(() => {
    if (!state) return 0;
    let stocksValue = 0;
    Object.entries(state.player?.assets?.stocks || {}).forEach(([t, q]: any) => {
      stocksValue += q * (state.markets?.[t]?.currentPrice || 0);
    });
    let cryptoValue = 0;
    Object.entries(state.player?.assets?.crypto || {}).forEach(([t, q]: any) => {
      cryptoValue += (q as number) * (state.cryptoChains?.[t]?.tokenPrice || 0);
    });
    let bondsValue = 0;
    Object.entries(state.player?.assets?.bonds || {}).forEach(([t, q]: any) => {
      bondsValue += (q as number) * 1000;
    });
    let shortsValue = 0;
    Object.entries(state.shorts || {}).forEach(([t, item]: any) => {
      const currentPrice = state.markets?.[t]?.currentPrice || 0;
      shortsValue += item.qty * currentPrice;
    });
    return (state.player?.cash || 0) + stocksValue + cryptoValue + bondsValue - shortsValue;
  }, [state]);

  // Format currency helper
  const formatCurrency = (val: number) => {
    if (val >= 1e12) return `$${(val / 1e12).toFixed(2)}T`;
    if (val >= 1e9) return `$${(val / 1e9).toFixed(2)}B`;
    if (val >= 1e6) return `$${(val / 1e6).toFixed(2)}M`;
    return `$${val.toLocaleString()}`;
  };

  // Get active live value for Layer 3 data strip
  const { gameStatValue, feedNameText } = useMemo(() => {
    if (!state) {
      return { gameStatValue: 'NOMINAL', feedNameText: 'STANDBY_CORE' };
    }

    switch (feedId) {
      case 'CERN':
        return {
          gameStatValue: `ENERGY: ${energySpikeValue.toFixed(2)} TeV`,
          feedNameText: 'CERN_LHC_TELEMETRY',
        };
      case 'MRKTS':
        return {
          gameStatValue: `AUM: ${formatCurrency(portfolioAUM)}`,
          feedNameText: 'SOVEREIGN_CDS_SPREADS',
        };
      case 'INTEL': {
        const nations = Object.values(state.countries || {});
        const maxStress = nations.length > 0 ? Math.max(...nations.map((c) => c.debtStress)) : 42.4;
        return {
          gameStatValue: `MAX_STRESS: ${maxStress.toFixed(1)}%`,
          feedNameText: 'PALANTIR_GRAPH_NET',
        };
      }
      case 'ATMO':
        return {
          gameStatValue: `RAIN_INTENSITY: ${(state.weatherThreat || 15).toFixed(1)}%`,
          feedNameText: 'BLACK_RAIN_METEOROLOGY',
        };
      default:
        return { gameStatValue: 'UNKNOWN', feedNameText: 'UNKNOWN_RECEPTOR' };
    }
  }, [feedId, state, portfolioAUM, energySpikeValue]);

  // Color grade class name selection
  const getColorGradeClass = () => {
    if (colorGrade === 'flood') return styles.gradeFlood;
    if (colorGrade === 'heat') return styles.gradeHeat;
    return styles.gradeDefault;
  };

  return (
    <>
      {/* Layer 1: Horizontal Scanlines Overlay (restricted to videoArea via CSS) */}
      <div className={styles.scanlines} />

      {/* Layer 1b: Vertical degradation scanline mesh if weather is severe */}
      {isFeedDegraded && <div className={styles.additionalScanlines} />}

      {/* Layer 2: Four amber corner brackets (SVG layout) */}
      <svg className={styles.brackets} width="100%" height="100%">
        {/* Top-Left Bracket */}
        <path d="M 12 24 L 12 12 L 24 12" fill="none" className={styles.bracketLine} />
        {/* Top-Right Bracket */}
        <path d="M calc(100% - 12) 24 L calc(100% - 12) 12 L calc(100% - 24) 12" fill="none" className={styles.bracketLine} />
        {/* Bottom-Left Bracket */}
        <path d="M 12 calc(100% - 24) L 12 calc(100% - 12) L 24 calc(100% - 12)" fill="none" className={styles.bracketLine} />
        {/* Bottom-Right Bracket */}
        <path d="M calc(100% - 12) calc(100% - 24) L calc(100% - 12) calc(100% - 12) L calc(100% - 24) calc(100% - 12)" fill="none" className={styles.bracketLine} />
      </svg>

      {/* Layer 3: Dynamic bottom data strip (last 22px of height) */}
      <div className={styles.dataStrip}>
        <div className={styles.dataStripSection}>
          [{feedId}] // {feedNameText}
        </div>
        <div className={styles.dataStripSection}>
          {gameStatValue}
        </div>
        <div>
          TICK: {String(state?.currentTick ?? 1).padStart(5, '0')}
        </div>
      </div>

      {/* Layer 4: Interactive Color Grade */}
      <div className={`${styles.colorGrade} ${getColorGradeClass()}`} />

      {/* Layer 5: White noise flash signal damage overlay (invisible unless triggered) */}
      {isNoiseFlash && (
        <div
          className="absolute inset-0 z-30 pointer-events-none opacity-20 bg-cover"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0%200%20100%20100'%20xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter%20id='noise'%3E%3CfeTurbulence%20type='fractalNoise'%20baseFrequency='0.95'%20numOctaves='3'%20stitchTiles='stitch'/%3E%3C/filter%3E%3Crect%20width='100%25'%20height='100%25'%20filter='url(%23noise)'/%3E%3C/svg%3E")`,
            filter: 'contrast(400%) invert(1)'
          }}
        />
      )}
    </>
  );
}
