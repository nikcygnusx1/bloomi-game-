import { useEffect, useRef, useState } from 'react';
import { SimState } from '../../types';

interface UseGameEventsProps {
  state: SimState | null;
  onAutoSwitchFeed: (feedId: 'CERN' | 'MRKTS' | 'INTEL' | 'ATMO') => void;
}

export function useGameEvents({ state, onAutoSwitchFeed }: UseGameEventsProps) {
  const [colorGrade, setColorGrade] = useState<'default' | 'flood' | 'heat'>('default');
  const [isNoiseFlash, setIsNoiseFlash] = useState(false);
  const [isFeedDegraded, setIsFeedDegraded] = useState(false);
  const [pulseRedBorder, setPulseRedBorder] = useState(false);
  const [energySpikeValue, setEnergySpikeValue] = useState(13.6);

  // References to preserve state across ticks
  const prevWeatherRef = useRef<string | null>(null);
  const prevTickRef = useRef<number>(-1);
  const prevStressTriggerRef = useRef<Record<string, boolean>>({});

  useEffect(() => {
    if (!state) return;

    // Trigger intermittent lightning flashes during storms
    let lightningTimer: NodeJS.Timeout | null = null;
    const isStormActive = state.currentWeather === 'LIGHTNING_STORM' || state.currentWeather === 'GRID_COLLAPSE';
    if (isStormActive) {
      lightningTimer = setInterval(() => {
        if (Math.random() < 0.20) {
          setIsNoiseFlash(true);
          setTimeout(() => setIsNoiseFlash(false), 120);
        }
      }, 3000);
    }

    // Tick changes
    if (state.currentTick !== prevTickRef.current) {
      // 1. Weather Events
      if (state.currentWeather !== prevWeatherRef.current) {
        const cw = state.currentWeather;

        // LIGHTNING_STRIKE detection
        if (cw === 'LIGHTNING_STORM' || cw === 'GRID_COLLAPSE') {
          setIsNoiseFlash(true);
          setTimeout(() => setIsNoiseFlash(false), 120);
        } 
        // FLASH_FLOOD detection
        else if (cw === 'FLASH_FLOOD' || cw === 'MONSOON_BREACH') {
          setColorGrade('flood');
          const t = setTimeout(() => setColorGrade('default'), 2000);
          return () => clearTimeout(t);
        } 
        // HEAT_DOME_ACTIVE detection
        else if (cw === 'HEAT_DOME') {
          setColorGrade('heat');
          const t = setTimeout(() => setColorGrade('default'), 3000);
          return () => clearTimeout(t);
        }

        prevWeatherRef.current = cw;
      }

      // BLACK_RAIN_LEVEL_4 (or equivalent weather degradation)
      // We check if weather is BLACK_RAIN/MONSOON_BREACH or generic weather threat is critical
      if (
        state.weatherThreat > 75 || 
        state.currentWeather === 'BLACK_RAIN' || 
        state.currentWeather === 'MONSOON_BREACH'
      ) {
        setIsFeedDegraded(true);
      } else {
        setIsFeedDegraded(false);
      }

      // 2. Sovereign Debt Defaults / Spreads
      // Switch to MRKTS + red pulse for 1s when a nation hits severe stress (above 85) for first time
      const countriesList = Object.values(state.countries || {});
      let hasNewStress = false;
      const currentStress: Record<string, boolean> = {};

      for (const country of countriesList) {
        if (country.debtStress > 85) {
          currentStress[country.id] = true;
          if (!prevStressTriggerRef.current[country.id]) {
            hasNewStress = true;
          }
        }
      }

      if (hasNewStress) {
        onAutoSwitchFeed('MRKTS');
        setPulseRedBorder(true);
        const t = setTimeout(() => setPulseRedBorder(false), 1000);
        prevStressTriggerRef.current = currentStress;
        // Clean up timeout on unmount inside react standard or keep it simple
      } else {
        // Update stress markers to avoid missing a country that recovers and fails again
        prevStressTriggerRef.current = currentStress;
      }

      // 3. COLLIDER_ARMED detection
      // If power is extreme, spike CERN and auto-switch
      if (state.labPowerUsed > state.labPowerMax * 0.85) {
        onAutoSwitchFeed('CERN');
        // Calculate a random high energy spike between 14.5 and 18.2 TeV
        setEnergySpikeValue(14.5 + Math.random() * 3.7);
        const resetTimer = setTimeout(() => {
          setEnergySpikeValue(13.6);
        }, 3000);
        return () => clearTimeout(resetTimer);
      } else {
        setEnergySpikeValue(13.6);
      }

      prevTickRef.current = state.currentTick;
    }

    return () => {
      if (lightningTimer) clearInterval(lightningTimer);
    };
  }, [state, onAutoSwitchFeed]);

  return {
    colorGrade,
    isNoiseFlash,
    isFeedDegraded,
    pulseRedBorder,
    energySpikeValue
  };
}
