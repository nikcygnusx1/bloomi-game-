import { useEffect, useRef, useState } from 'react';
import { SimState } from '../../types';

export function useGameEvents(state: SimState | null) {
  const [colorGrade, setColorGrade] = useState<'default' | 'flood' | 'heat'>('default');
  const [isNoiseFlash, setIsNoiseFlash] = useState(false);
  const [isFeedDegraded, setIsFeedDegraded] = useState(false);
  const [sovereignDefault, setSovereignDefault] = useState(false);
  const [colliderArmed, setColliderArmed] = useState(false);
  const [bunkerThreat, setBunkerThreat] = useState(false);

  // References to preserve state across ticks safely
  const prevWeatherRef = useRef<string | null>(null);
  const prevTickRef = useRef<number>(-1);
  const prevStressTriggerRef = useRef<Record<string, number>>({});

  useEffect(() => {
    if (!state) return;

    // Check on tick changes
    if (state.currentTick !== prevTickRef.current) {
      const cw = state.currentWeather;

      // 1. Weather Event Transitions
      if (cw !== prevWeatherRef.current) {
        // LIGHTNING_STRIKE lightning flicker detection
        if (cw === 'LIGHTNING_STORM' || cw === 'GRID_COLLAPSE') {
          setIsNoiseFlash(true);
          setTimeout(() => setIsNoiseFlash(false), 120);
        } 
        // FLASH_FLOOD detection
        else if (cw === 'FLASH_FLOOD' || cw === 'MONSOON_BREACH') {
          setColorGrade('flood');
          const t = setTimeout(() => setColorGrade('default'), 2000);
          prevWeatherRef.current = cw;
          return () => clearTimeout(t);
        } 
        // HEAT_DOME_ACTIVE detection
        else if (cw === 'HEAT_DOME') {
          setColorGrade('heat');
          const t = setTimeout(() => setColorGrade('default'), 3000);
          prevWeatherRef.current = cw;
          return () => clearTimeout(t);
        }

        prevWeatherRef.current = cw;
      }

      // 2. BLACK_RAIN_LVL_5 or severe rain degradation (increase static scanline visuals)
      if (state.weatherThreat >= 80 || cw === 'BLACK_RAIN' || cw === 'MONSOON_BREACH') {
        setIsFeedDegraded(true);
      } else {
        setIsFeedDegraded(false);
      }

      // 3. SOVEREIGN_DEFAULT detection (debtStress exceeding 85% for any nation)
      const countriesList = Object.values(state.countries || {});
      let hasNewStress = false;
      
      for (const country of countriesList) {
        const prevStress = prevStressTriggerRef.current[country.id] || 0;
        if (country.debtStress > 85 && prevStress <= 85) {
          hasNewStress = true;
        }
        prevStressTriggerRef.current[country.id] = country.debtStress;
      }

      if (hasNewStress) {
        setSovereignDefault(true);
        const t = setTimeout(() => setSovereignDefault(false), 1500);
        prevWeatherRef.current = cw;
        return () => clearTimeout(t);
      }

      // 4. COLLIDER_ARMED detection (CERN LHC operations drawing peak power)
      if (state.labPowerUsed > state.labPowerMax * 0.82) {
        setColliderArmed(true);
        const t = setTimeout(() => setColliderArmed(false), 4000);
        prevWeatherRef.current = cw;
        return () => clearTimeout(t);
      }

      // 5. BUNKER_THREAT detection (If threat level exceeds critical threshold or grid falls)
      if (state.omegaThreatLevel > 70 || cw === 'GRID_COLLAPSE') {
        setBunkerThreat(true);
      } else {
        setBunkerThreat(false);
      }

      prevTickRef.current = state.currentTick;
    }
  }, [state]);

  // Render sudden localized storm signal degradation during heavy lightning storms
  useEffect(() => {
    if (!state) return;
    const cw = state.currentWeather;
    if (cw === 'LIGHTNING_STORM' || cw === 'GRID_COLLAPSE') {
      const interval = setInterval(() => {
        if (Math.random() < 0.22) {
          setIsNoiseFlash(true);
          setTimeout(() => setIsNoiseFlash(false), 120);
        }
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [state?.currentWeather]);

  return {
    colorGrade,
    isNoiseFlash,
    isFeedDegraded,
    sovereignDefault,
    colliderArmed,
    bunkerThreat,
  };
}
