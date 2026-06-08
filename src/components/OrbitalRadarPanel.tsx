/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import React, { useState, useEffect, useRef } from 'react';
import { SimState } from '../types';

interface OrbitalRadarPanelProps {
  state: SimState;
  onModifyState: (fn: (prev: SimState) => SimState) => void;
  onLogTerminal: (msg: string, isError?: boolean) => void;
  playSyntheticSound: (type: 'tick' | 'order' | 'profit' | 'warning' | 'liquidation' | 'click' | 'alert' | 'success') => void;
}

interface SatLog {
  time: string;
  text: string;
  type: 'info' | 'connect' | 'success' | 'warning' | 'action';
}

export const OrbitalRadarPanel: React.FC<OrbitalRadarPanelProps> = ({
  state,
  onModifyState,
  onLogTerminal,
  playSyntheticSound
}) => {
  const [selectedSatId, setSelectedSatId] = useState<string>('');
  const [sweepAngle, setSweepAngle] = useState<number>(0);
  const [localSats, setLocalSats] = useState<Array<{ name: string; id: string; r: number; speed: number; angle: number; status: string }>>([]);
  const [operationProgress, setOperationProgress] = useState<number>(0);
  const [activeOperation, setActiveOperation] = useState<string | null>(null);
  const [orbitalLogs, setOrbitalLogs] = useState<SatLog[]>([
    { time: '12:00:15', text: 'SYSTEM INITIALIZED: Orbital sensor core linked.', type: 'info' },
    { time: '12:00:20', text: 'CALIBRATION: High-Earth azimuth sweep complete.', type: 'connect' }
  ]);

  const animationRef = useRef<number | null>(null);
  const operationTimerRef = useRef<any>(null);

  // Initialize satellites from gameState structure
  useEffect(() => {
    if (state.satelliteCoordinates && state.satelliteCoordinates.length > 0) {
      // Avoid overwriting and resetting smooth animation angles on every tick
      if (localSats.length === state.satelliteCoordinates.length) {
        return;
      }
      const initialSats = state.satelliteCoordinates.map((sat: any, index: number) => {
        // Map current x/y coordinates into radial orbital coordinates
        const id = sat.id || `sat_${index}`;
        const orbitRadius = 60 + ((index + 1) * 35);
        const orbitSpeed = 0.001 * (1.5 - (index * 0.15));
        const initialAngle = (sat.x * 0.05) % (Math.PI * 2);
        return {
          id,
          name: sat.name || `CORVUS_${index + 1}`,
          r: orbitRadius,
          speed: orbitSpeed,
          angle: initialAngle,
          status: 'STABLE_ORBIT'
        };
      });
      setLocalSats(initialSats);
      if (!selectedSatId && initialSats.length > 0) {
        setSelectedSatId(initialSats[0].id);
      }
    }
  }, [state.satelliteCoordinates, localSats.length]);

  // Request Animation Frame for super smooth orbital rotation & radar sweeps
  useEffect(() => {
    const updateOrbit = () => {
      setSweepAngle((prev) => (prev + 0.012) % (Math.PI * 2));
      
      setLocalSats((prevSats) => {
        return prevSats.map((sat) => {
          let speedFactor = 1;
          if (activeOperation && selectedSatId === sat.id) {
            speedFactor = 0.3; // Orbit slows down during high orbital actions
          }
          return {
            ...sat,
            angle: (sat.angle + sat.speed * speedFactor) % (Math.PI * 2)
          };
        });
      });

      animationRef.current = requestAnimationFrame(updateOrbit);
    };

    animationRef.current = requestAnimationFrame(updateOrbit);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [activeOperation, selectedSatId]);

  const addOrbitalLog = (text: string, type: SatLog['type']) => {
    const timeStr = new Date().toTimeString().split(' ')[0];
    setOrbitalLogs((prev) => [{ time: timeStr, text, type }, ...prev].slice(0, 50));
  };

  const handleLaunchSatellite = () => {
    if (state.player.cash < 180000000) {
      onLogTerminal('REJECTED: Insufficient cash ($180M required) for satellite launch.', true);
      playSyntheticSound('warning');
      return;
    }

    onModifyState((prev) => {
      const next = { ...prev };
      next.player.cash -= 180000000;
      const newId = next.satelliteCoordinates ? next.satelliteCoordinates.length + 1 : 1;
      const name = 'CORVUS_' + String.fromCharCode(64 + newId);
      const satId = 'sat_' + newId;

      if (!next.satelliteCoordinates) next.satelliteCoordinates = [];
      next.satelliteCoordinates.push({
        id: satId,
        name,
        x: Math.random() * 400 + 100,
        y: Math.random() * 150 + 50
      });

      playSyntheticSound('profit');
      onLogTerminal(`PAYLOAD DEPLOYED: Satellite ${name} booster stage separated. Anchored in low-Earth trajectory.`);
      addOrbitalLog(`LAUNCH DEPLOYED: ${name} fully energized in new orbit sector.`, 'success');
      return next;
    });
  };

  const executeOrbitalOperation = (opId: string) => {
    if (activeOperation) return;

    const currentSat = localSats.find(s => s.id === selectedSatId);
    if (!currentSat) {
      addOrbitalLog('ERROR: Select an active satellite to direct payload beams.', 'warning');
      playSyntheticSound('warning');
      return;
    }

    let duration = 3000; // milliseconds
    let logMessage = '';
    let successMessage = '';
    let benefitFn: (prev: SimState) => SimState = s => s;

    switch (opId) {
      case 'SIGNAL_DRILL':
        logMessage = `SIGNAL DRILL initiated on ${currentSat.name}. Projecting microwave beam towards central hubs...`;
        successMessage = `TAP SUCCESSFUL: ${currentSat.name} intercepted 14.8 Tbit encrypted governmental logs.`;
        playSyntheticSound('click');
        benefitFn = (prev) => {
          const next = { ...prev };
          next.researchPoints = (next.researchPoints || 0) + 120;
          next.neuralFirewallPower = Math.min(100, next.neuralFirewallPower + 10);
          onLogTerminal(`ORBITAL INTEL ACQUIRED: ${currentSat.name} compiled central networks research log. +120 Research.`);
          return next;
        };
        break;

      case 'CAPITAL_EXTRACTION':
        logMessage = `CAPITAL EXTRACTION triggered on ${currentSat.name}. Pinpointing dark pool transaction channels...`;
        successMessage = `HARVEST SUCCESSFUL: Diverted transactions through shadow sub-nodes.`;
        playSyntheticSound('click');
        benefitFn = (prev) => {
          const next = { ...prev };
          const amountGained = Math.floor(Math.random() * 20000000) + 15000000; // $15M - $35M
          next.player.cash += amountGained;
          onLogTerminal(`ORBITALLY CAPTURED LIQUIDITY: Absorbed $${(amountGained / 1e6).toFixed(2)}M from offshore flight channels.`);
          return next;
        };
        break;

      case 'DEPOT_SURVEY':
        logMessage = `PHOTOGRAMMETRIC DEPOT SURVEY initiated. Calibrating deep ground resolution lasers...`;
        successMessage = `SURVEY COMPLETE: High-fidelity mineral profiles synced into Somatic Core.`;
        playSyntheticSound('success');
        benefitFn = (prev) => {
          const next = { ...prev };
          next.biomass = (next.biomass || 0) + 160;
          onLogTerminal(`DEPOT TELEMETRY INTERCEPTED: Scanned Raw Material Depots from high orbit. +160 Genetic Capital / Biomass.`);
          return next;
        };
        break;

      case 'JAM_TRACE':
        if (state.player.cash < 10000000) {
          onLogTerminal('REJECTED: Insufficient budget ($10M required) to deploy electromagnetic trace jamming.', true);
          playSyntheticSound('warning');
          return;
        }
        logMessage = `JAMMING BEAM CHARGED (-$10M). Splattering OMEGA cyber tracing grids...`;
        successMessage = `JAMMING COMPLETE: Subnet trace scrambled. Threat indices corrected.`;
        playSyntheticSound('alert');
        benefitFn = (prev) => {
          const next = { ...prev };
          next.player.cash -= 10000000;
          next.omegaThreatLevel = Math.max(0, next.omegaThreatLevel - 15);
          onLogTerminal(`OMEGA TRACING JAMMED: Ground tracing satellites jammed successfully. Threat level down 15%.`);
          return next;
        };
        break;
      default:
        return;
    }

    setActiveOperation(opId);
    setOperationProgress(0);
    addOrbitalLog(logMessage, 'action');

    const steps = 30;
    const intervalMs = duration / steps;
    let currentStep = 0;

    if (operationTimerRef.current) clearInterval(operationTimerRef.current);

    operationTimerRef.current = setInterval(() => {
      currentStep++;
      setOperationProgress(Math.floor((currentStep / steps) * 100));

      if (currentStep >= steps) {
        clearInterval(operationTimerRef.current);
        onModifyState(benefitFn);
        playSyntheticSound('profit');
        addOrbitalLog(successMessage, 'success');
        setActiveOperation(null);
        setOperationProgress(0);
      } else {
        if (currentStep % 10 === 0) {
          playSyntheticSound('tick');
        }
      }
    }, intervalMs);
  };

  const selectedSat = localSats.find(s => s.id === selectedSatId);

  return (
    <div className="flex flex-col md:flex-row gap-3 h-full overflow-hidden select-none font-mono text-xs text-[#00c2ff] bg-[#07090d]">
      
      {/* LEFT COLUMN: ACTIVE RADAR GRID */}
      <div className="flex-1 bg-[#0a0c0f] border border-[#1e2535] rounded-terminal p-3 flex flex-col justify-between items-center relative min-h-[280px]">
        
        {/* Radar Azimuth scan visual header */}
        <div className="w-full flex justify-between text-[8px] text-slate-500 uppercase tracking-wider font-terminal">
          <span>CO-INTEGRATION AZIMUTH PLOT</span>
          <span className="text-yellow-500 font-bold animate-pulse">// ACTIVE BEAM SWEEPING //</span>
        </div>

        {/* Center Circular Radar Plot */}
        <div className="relative w-full flex-1 flex items-center justify-center py-2 h-[220px]">
          <svg viewBox="0 0 400 400" className="w-[220px] h-[220px] max-w-full max-h-full">
            {/* Radar Background Grids */}
            <circle cx="200" cy="200" r="190" className="fill-none stroke-blue-900/35 stroke-[0.8]" />
            <circle cx="200" cy="200" r="140" className="fill-none stroke-blue-900/40 stroke-1 border-dashed" style={{ strokeDasharray: '4 4' }} />
            <circle cx="200" cy="200" r="90" className="fill-none stroke-blue-900/40 stroke-[0.8]" />
            <circle cx="200" cy="200" r="40" className="fill-none stroke-[#1e263c] stroke-1" />
            
            {/* Centering crosshairs */}
            <line x1="200" y1="0" x2="200" y2="400" className="stroke-[#1e2535]/30 stroke-[0.8]" />
            <line x1="0" y1="200" x2="400" y2="200" className="stroke-[#1e2535]/30 stroke-[0.8]" />
            
            {/* Real-time sweeping beam with decay fade trail */}
            <line 
              x1="200" 
              y1="200" 
              x2={200 + 190 * Math.cos(sweepAngle)} 
              y2={200 + 190 * Math.sin(sweepAngle)} 
              className="stroke-yellow-500/60 stroke-[1.5]" 
            />
            
            {/* Orbital orbits pathways */}
            {localSats.map((sat, idx) => (
              <circle key={`orbit-${idx}`} cx="200" cy="200" r={sat.r} className="fill-none stroke-[#1e2535]/40 stroke-[0.5]" />
            ))}

            {/* Orbiting Satellites plotted dot nodes */}
            {localSats.map((sat) => {
              const xPos = 200 + sat.r * Math.cos(sat.angle);
              const yPos = 200 + sat.r * Math.sin(sat.angle);
              const isSelected = selectedSatId === sat.id;

              return (
                <g key={sat.id} className="cursor-pointer" onClick={() => { setSelectedSatId(sat.id); playSyntheticSound('tick'); }}>
                  {/* Outer selector halo */}
                  {isSelected && (
                    <circle cx={xPos} cy={yPos} r="10" className="fill-none stroke-yellow-500 stroke-[1] animate-ping" />
                  )}
                  {isSelected && (
                    <rect x={xPos - 7} y={yPos - 7} width="14" height="14" className="fill-none stroke-[#00c2ff] stroke-[0.5] stroke-dashed" />
                  )}
                  {/* Central glowing core node */}
                  <circle cx={xPos} cy={yPos} r="4" className={`${isSelected ? 'fill-[#00ff88]' : 'fill-yellow-400'} stroke-black stroke-[0.8]`} />
                  <circle cx={xPos} cy={yPos} r="1.5" className="fill-white" />
                  <text x={xPos + 6} y={yPos + 3} className={`text-[7px] font-bold ${isSelected ? 'fill-[#00ff88]' : 'fill-yellow-400/80'}`}>{sat.name}</text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Console Footing with active readings */}
        <div className="w-full flex justify-between items-center border-t border-[#1e2535] pt-1.5 text-[8px] text-slate-500 font-terminal uppercase">
          <span>RADAR Sweep Azimuth: {((sweepAngle * 180) / Math.PI).toFixed(0)}Deg</span>
          <div className="flex gap-2.5">
            <span>UNITS ALIGNED: {localSats.length} / 8 max</span>
            <span className="text-yellow-600">RESOLUTION: sub-0.1M RESOLUTION DETECT</span>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: TACTICAL CONTROL DECK */}
      <div className="w-full md:w-[250px] lg:w-[290px] shrink-0 flex flex-col gap-2 uppercase">
        
        {/* Constellation Selector & Status */}
        <div className="bg-[#141920] border border-[#1e2535] p-2.5 rounded-terminal flex flex-col gap-2 font-terminal">
          <div className="flex justify-between items-center border-b border-[#1e2535] pb-1.5">
            <span className="text-[8px] text-slate-400 font-black">// TACTICAL ORBIT PROTOCOL</span>
            <span className="text-[#00ff88] font-mono text-[9px]">ONLINE_STANDBY</span>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[7.5px] text-slate-400 font-bold">SELECT ACTIVE PAYLOAD SATELLITE</label>
            <div className="flex gap-1">
              <select
                value={selectedSatId}
                onChange={(e) => { setSelectedSatId(e.target.value); playSyntheticSound('tick'); }}
                className="flex-1 bg-[#090c10] border border-[#1e2535] p-1 text-[#00c2ff] text-[10px] outline-none focus:border-yellow-500 font-mono font-bold"
              >
                {localSats.map((sat) => (
                  <option key={sat.id} value={sat.id}>
                    {sat.name} [ALT: {(sat.r * 8.2).toFixed(0)}KM]
                  </option>
                ))}
              </select>
            </div>
          </div>

          {selectedSat && (
            <div className="bg-[#0b0d12] border border-[#1e2535]/45 p-1.5 rounded-terminal text-[8.5px] text-slate-300 space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">BATTERY POWER:</span>
                <span className="text-[#00ff88] font-bold">100% SECURE</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">ORBIT VELOCITY:</span>
                <span className="text-[#00c2ff]">{(7800 + selectedSat.r * 2.5).toFixed(0)} M/S</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">BEAM TARGET:</span>
                <span className="text-yellow-400 font-bold">{activeOperation ? `${activeOperation}` : 'STATIONARY_SCAN'}</span>
              </div>
            </div>
          )}
        </div>

        {/* Interactive Satellite Capture Protocols */}
        <div className="bg-[#141920] border border-[#1e2535] p-2.5 rounded-terminal flex flex-col gap-2 font-terminal flex-1 justify-between">
          <div>
            <span className="text-[8px] text-slate-400 block mb-1.5 font-bold">// INTEGRATED ORBITAL BEAM PAYLOADS</span>
            
            <div className="space-y-1.5 max-h-[170px] overflow-y-auto pr-1">
              
              {/* Op 1: Signal Trap */}
              <button
                disabled={!!activeOperation}
                onClick={() => executeOrbitalOperation('SIGNAL_DRILL')}
                className={`w-full text-left p-1.5 border border-[#1e2535] bg-[#0a0c0f] hover:bg-cyan-950/20 hover:border-cyan-500/50 rounded flex justify-between items-center transition-all cursor-pointer ${activeOperation ? 'opacity-45 cursor-not-allowed' : ''}`}
              >
                <div>
                  <div className="text-[9.5px] font-bold text-cyan-400">SIGNAL TAP DIRECT</div>
                  <div className="text-[7.5px] text-slate-400">HARVEST CORE TELEMETRY PACKS // +120 RES</div>
                </div>
                <span className="text-[8px] text-cyan-300 bg-cyan-950/40 px-1 rounded border border-cyan-800">FREE</span>
              </button>

              {/* Op 2: Capital Corridor Extraction */}
              <button
                disabled={!!activeOperation}
                onClick={() => executeOrbitalOperation('CAPITAL_EXTRACTION')}
                className={`w-full text-left p-1.5 border border-[#1e2535] bg-[#0a0c0f] hover:bg-emerald-950/20 hover:border-emerald-500/50 rounded flex justify-between items-center transition-all cursor-pointer ${activeOperation ? 'opacity-45 cursor-not-allowed' : ''}`}
              >
                <div>
                  <div className="text-[9.5px] font-bold text-[#00ff88]">CAPITAL ARB DRAIN</div>
                  <div className="text-[7.5px] text-slate-400">EXTRACT OFFSHORE FLOWS // EXTRA CASH</div>
                </div>
                <span className="text-[8px] text-emerald-300 bg-emerald-950/40 px-1 rounded border border-emerald-800">FREE</span>
              </button>

              {/* Op 3: Geographic Depot Survey */}
              <button
                disabled={!!activeOperation}
                onClick={() => executeOrbitalOperation('DEPOT_SURVEY')}
                className={`w-full text-left p-1.5 border border-[#1e2535] bg-[#0a0c0f] hover:bg-yellow-950/20 hover:border-yellow-500/50 rounded flex justify-between items-center transition-all cursor-pointer ${activeOperation ? 'opacity-45 cursor-not-allowed' : ''}`}
              >
                <div>
                  <div className="text-[9.5px] font-bold text-yellow-400">DEPOT INTEL TARGET</div>
                  <div className="text-[7.5px] text-slate-400">SCAN MINERAL DEPOTS CRYPTO ARCHIVES</div>
                </div>
                <span className="text-[8px] text-yellow-300 bg-yellow-950/40 px-1 rounded border border-yellow-850">FREE</span>
              </button>

              {/* Op 4: Overwrite Trace Jam */}
              <button
                disabled={!!activeOperation || state.player.cash < 10000000}
                onClick={() => executeOrbitalOperation('JAM_TRACE')}
                className={`w-full text-left p-1.5 border border-[#1e2535] bg-[#0a0c0f] hover:bg-rose-950/20 hover:border-rose-500/50 rounded flex justify-between items-center transition-all cursor-pointer ${activeOperation ? 'opacity-45 cursor-not-allowed' : ''}`}
              >
                <div>
                  <div className="text-[9.5px] font-bold text-red-400">COVERT JAM OMEGA</div>
                  <div className="text-[7.5px] text-slate-400">SCRAMBLE OMEGA TRACKING MATRIX // -15% THREAT</div>
                </div>
                <span className="text-[8px] text-red-400 bg-rose-950/40 px-1 rounded border border-rose-900">$10.0M</span>
              </button>

            </div>
          </div>

          {/* Operation progress bar */}
          {activeOperation && (
            <div className="mt-2 p-1.5 bg-[#090c10] border border-[#1e2535] rounded-terminal">
              <div className="flex justify-between text-[8px] text-slate-400 mb-1">
                <span>BEAM STATUS: LOADING PAYLOAD...</span>
                <span className="text-yellow-400 font-bold">{operationProgress}%</span>
              </div>
              <div className="w-full bg-[#141920] h-1.5 rounded-full overflow-hidden border border-[#2b354e]">
                <div 
                  className="bg-yellow-400 h-full transition-all duration-100" 
                  style={{ width: `${operationProgress}%` }} 
                />
              </div>
            </div>
          )}

          <div className="mt-1">
            <button
              onClick={handleLaunchSatellite}
              disabled={state.player.cash < 180000000}
              className="w-full bg-yellow-500/10 hover:bg-yellow-500/25 border border-yellow-500/50 text-yellow-500 font-bold py-1.5 rounded-terminal uppercase tracking-tight text-center text-[10px] cursor-pointer transition-colors block"
            >
              LAUNCH NEW SATELLITE (-$180.0M)
            </button>
          </div>
        </div>

        {/* Orbit Logs display screen */}
        <div className="bg-[#0b0e14] border border-[#1e2535] p-2 rounded-terminal font-terminal h-[110px] flex flex-col justify-between overflow-hidden">
          <span className="text-[8px] text-slate-500 border-b border-[#1e2535] pb-0.5 mb-1 flex justify-between block font-bold">
            <span>// ORBIT ENGINE LOGS</span>
            <span className="text-[#00ff88] animate-pulse">● FEED</span>
          </span>
          <div className="flex-1 overflow-y-auto space-y-1 pr-1 font-mono text-[7.5px]">
            {orbitalLogs.map((log, index) => {
              let logColor = 'text-slate-400';
              if (log.type === 'connect') logColor = 'text-cyan-400';
              if (log.type === 'success') logColor = 'text-[#00ff88] font-bold';
              if (log.type === 'warning') logColor = 'text-red-400';
              if (log.type === 'action') logColor = 'text-yellow-400 animate-pulse';

              return (
                <div key={index} className="flex gap-1.5 items-start leading-[1.15]">
                  <span className="text-slate-600 shrink-0">{log.time}</span>
                  <p className={logColor}>{log.text}</p>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
};
