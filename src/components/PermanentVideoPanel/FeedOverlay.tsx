import React, { useMemo } from 'react';
import { SimState } from '../../types';
import { FeedConfig } from '../../config/videoSources';
import styles from './styles.module.css';

interface FeedOverlayProps {
  feed: FeedConfig;
  state: SimState | null;
  isFocused: boolean;
  colorGrade: 'default' | 'flood' | 'heat';
  isNoiseFlash: boolean;
  isFeedDegraded: boolean;
  sovereignDefault: boolean;
  colliderArmed: boolean;
  bunkerThreat: boolean;
  isLiveActive: boolean;
}

export function FeedOverlay({
  feed,
  state,
  isFocused,
  colorGrade,
  isNoiseFlash,
  isFeedDegraded,
  sovereignDefault,
  colliderArmed,
  bunkerThreat,
  isLiveActive,
}: FeedOverlayProps) {
  // 1. Calculate player cash-AUM total
  const portfolioAUM = useMemo(() => {
    if (!state) return 0;
    
    let stocksValue = 0;
    Object.entries(state.player?.assets?.stocks || {}).forEach(([t, q]: any) => {
      const price = state.markets?.[t]?.currentPrice || 0;
      stocksValue += q * price;
    });

    let cryptoValue = 0;
    Object.entries(state.player?.assets?.crypto || {}).forEach(([t, q]: any) => {
      const price = state.cryptoChains?.[t]?.tokenPrice || 0;
      cryptoValue += (q as number) * price;
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

  const formatCurrency = (val: number) => {
    if (val >= 1e12) return `$${(val / 1e12).toFixed(2)}T`;
    if (val >= 1e9) return `$${(val / 1e9).toFixed(2)}B`;
    if (val >= 1e6) return `$${(val / 1e6).toFixed(2)}M`;
    return `$${val.toLocaleString()}`;
  };

  // 2. Resolve live data readings for bottom 18px data strips per feed
  const dataString = useMemo(() => {
    if (!state) return feed.dataOverlay;

    switch (feed.id) {
      case 'orbital': {
        // Active Satellites Tracker
        const sats = state.activeSatellitesCount ?? 4;
        const target = state.satelliteTargetId || 'N/A';
        return `ALT: 408 KM // SATS_CONNECTED: ${sats} // TARGET: ${target} // SPEED: 7.66 KM/S`;
      }
      case 'markets': {
        // Cash returns or dynamic portfolio metrics
        const formattingAUM = formatCurrency(portfolioAUM);
        const cashValue = formatCurrency(state.player?.cash || 0);
        return `AUM: ${formattingAUM} // LIQUID_CASH: ${cashValue} // BENCHMARK: +3.4%`;
      }
      case 'geopolitical': {
        // Stress of sovereign regions
        const nations = Object.values(state.countries || {});
        const maxStress = nations.length > 0 ? Math.max(...nations.map(c => c.debtStress)) : 42.4;
        const activeDefaults = nations.filter(c => c.debtStress > 80).length;
        return `MAX_STRESS: ${maxStress.toFixed(1)}% // SEC_THREAT: ${activeDefaults} REGIONS // RISK: ELEVATED`;
      }
      case 'particle': {
        // LHC particle collisions
        if (colliderArmed) {
          return `ENERGY: 16.0 TEV // CRITICAL SPIKE DISCHARGE // STATUS: COLLISION`;
        }
        const powerPrct = (((state.labPowerUsed || 50) / (state.labPowerMax || 100)) * 100).toFixed(0);
        return `ENERGY: 13.6 TEV // BUNCHES: 2748 // LAB_REACTOR_POWER: ${powerPrct}%`;
      }
      default:
        return feed.dataOverlay;
    }
  }, [feed.id, feed.dataOverlay, state, portfolioAUM, colliderArmed]);

  // Color grade select
  const colorGradeClass = () => {
    if (colorGrade === 'flood') return styles.gradeFlood;
    if (colorGrade === 'heat') return styles.gradeHeat;
    return styles.gradeDefault;
  };

  return (
    <>
      {/* Layer 1: Scanlines Overlay (Clipped to cell boundary) */}
      <div className={isFeedDegraded ? styles.degradedScanlines : styles.scanlines} />

      {/* Layer 2: Amber color grade */}
      <div className={`${styles.colorGrade} ${colorGradeClass()}`} />

      {/* Layer 3: Corner brackets (SVG) */}
      <svg className={styles.brackets} viewBox="0 0 100 100" preserveAspectRatio="none">
        {/* Top-Left */}
        <path d="M 4 8 L 4 4 L 8 4" fill="none" stroke="#FF6F00" strokeWidth="1.2" opacity="0.85" />
        {/* Top-Right */}
        <path d="M 96 8 L 96 4 L 92 4" fill="none" stroke="#FF6F00" strokeWidth="1.2" opacity="0.85" />
        {/* Bottom-Left */}
        <path d="M 4 92 L 4 96 L 8 96" fill="none" stroke="#FF6F00" strokeWidth="1.2" opacity="0.85" />
        {/* Bottom-Right */}
        <path d="M 96 92 L 96 96 L 92 96" fill="none" stroke="#FF6F00" strokeWidth="1.2" opacity="0.85" />
      </svg>

      {/* Layer 4: Top-Left Feed Label */}
      <div className={`${styles.cellLabel} ${feed.id === 'geopolitical' && sovereignDefault ? styles.cellLabelFlashing : ''}`}>
        {feed.label}
      </div>

      {/* Layer 5: LIVE Dot Status Overlay */}
      <div className={styles.cellLiveIndicator}>
        {isLiveActive ? (
          <>
            <div className={styles.cellLiveDot} />
            <span>LIVE</span>
          </>
        ) : (
          <span className={styles.cellOfflineText}>◈ ARCHIVE</span>
        )}
      </div>

      {/* Layer 6: Dynamic Bottom Data Strip (18px) */}
      <div className={`${styles.cellDataStrip} ${isFocused ? styles.cellDataStripFocused : ''}`}>
        <span>{dataString}</span>
        <span>TICK: {String(state?.currentTick ?? 1).padStart(5, '0')}</span>
      </div>

      {/* Layer 7: Event Alerts (Warning Badges) */}
      {feed.id === 'orbital' && bunkerThreat && (
        <div className={styles.cellThreatOverlay}>
          THREAT_DETECTED // COGN_MUTATION
        </div>
      )}
      
      {feed.id === 'particle' && colliderArmed && (
        <div className={styles.cellThreatOverlay}>
          REACTOR_SPIKE // CRITICAL_DISCHARGE
        </div>
      )}

      {feed.id === 'geopolitical' && sovereignDefault && (
        <div className={styles.cellThreatOverlay} style={{ backgroundColor: '#ef4444' }}>
          SOVEREIGN_CDS_ALERT // LIMIT_DOWN
        </div>
      )}

      {/* Layer 8: Lightning Strike Noise Flash Overlay */}
      {isNoiseFlash && (
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.14] bg-cover z-30"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.90' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%' height='100%' filter='url(%23noise)'/%3E%3C/svg%3E")`,
            filter: 'contrast(300%) invert(1)',
          }}
        />
      )}
    </>
  );
}
