/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import React, { useState, useEffect, useRef } from 'react';
import { SimState } from '../types';

interface IntrusionConsoleProps {
  state: SimState;
  onModifyState: (fn: (prev: SimState) => SimState) => void;
  onLogTerminal: (msg: string, isError?: boolean) => void;
  playSyntheticSound: (type: 'tick' | 'order' | 'profit' | 'warning' | 'liquidation' | 'click' | 'alert' | 'success') => void;
}

interface CyberLog {
  time: string;
  source: string;
  desc: string;
  status: 'BLOCKED' | 'WARNING' | 'ALERT' | 'STANDBY' | 'PURGED';
}

export const IntrusionTraceConsole: React.FC<IntrusionConsoleProps> = ({
  state,
  onModifyState,
  onLogTerminal,
  playSyntheticSound
}) => {
  const [scanOffset, setScanOffset] = useState<number>(0);
  const [pingPulse, setPingPulse] = useState<boolean>(false);
  const [leakageRatio, setLeakageRatio] = useState<number>(18.4);
  const [packetRate, setPacketRate] = useState<number>(2410);
  const [cyberLogs, setCyberLogs] = useState<CyberLog[]>([
    { time: '14:20:11', source: 'FIREWALL_PORT_22', desc: 'Sovereign-state payload tracer neutralized.', status: 'BLOCKED' },
    { time: '14:20:18', source: 'OMEGA_LINK_ZETA', desc: 'Anomalous query pattern from Singapore subnet detected.', status: 'WARNING' },
    { time: '14:20:25', source: 'COGNITIVE_ARRAY', desc: 'Synchronized credential stuffing traced to Dark Pools.', status: 'BLOCKED' }
  ]);

  const scanTimerRef = useRef<any>(null);
  const logsTimerRef = useRef<any>(null);

  // Dynamic animations for scan wave and packet rate twitches
  useEffect(() => {
    // Smooth vertical scanning line animation
    scanTimerRef.current = setInterval(() => {
      setScanOffset((prev) => (prev + 3) % 220);
      setPacketRate((prev) => Math.max(1200, Math.min(4500, prev + Math.floor((Math.random() - 0.5) * 300))));
      setLeakageRatio((prev) => Math.max(5.0, Math.min(45.0, prev + (Math.random() - 0.5) * 1.2)));
      setPingPulse(prev => !prev);
    }, 150);

    const logSources = ['CN_CORRIDOR_IP', 'US_VAULT_GATE', 'EU_CORE_NET_3', 'CH_SECURE_PORT', 'DARK_POOL_ROUT', 'OMEGA_SENTINEL_2'];
    const logDescs = [
      'Encrypted handshakes detected over central trading desk routing.',
      'Reverse-tunnel attempt flagged over financial gateway block.',
      'Excessive API scrapers requesting commodities liquidity profiles.',
      'Memory blocks allocation scan blocked by local hypervisor.',
      'Intercepted packet sniffing on staff trade requisitions.'
    ];

    // Stream auto cyber events to make console dynamic and active
    logsTimerRef.current = setInterval(() => {
      const randomSrc = logSources[Math.floor(Math.random() * logSources.length)];
      const randomDesc = logDescs[Math.floor(Math.random() * logDescs.length)];
      const statuses: CyberLog['status'][] = ['BLOCKED', 'WARNING', 'ALERT'];
      const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
      
      const timeStr = new Date().toTimeString().split(' ')[0];
      setCyberLogs((prev) => [
        { time: timeStr, source: randomSrc, desc: randomDesc, status: randomStatus },
        ...prev
      ].slice(0, 30));
      
      if (Math.random() > 0.6) {
        playSyntheticSound('tick');
      }
    }, 3800);

    return () => {
      if (scanTimerRef.current) clearInterval(scanTimerRef.current);
      if (logsTimerRef.current) clearInterval(logsTimerRef.current);
    };
  }, []);

  const handleSubFirewall = () => {
    if (state.player.cash < 250000000) {
      onLogTerminal('REJECTED: Insufficient cash ($250M required) to deploy firewall reinforcements.', true);
      playSyntheticSound('warning');
      return;
    }

    onModifyState((prev) => {
      const next = { ...prev };
      next.player.cash -= 250000000;
      next.neuralFirewallPower = Math.min(100, next.neuralFirewallPower + 25);
      onLogTerminal('FIREWALL REINFORCED: Discharged clean subnet patches. Security ratings boosted.');
      playSyntheticSound('profit');
      return next;
    });

    const timeStr = new Date().toTimeString().split(' ')[0];
    setCyberLogs((prev) => [
      { time: timeStr, source: 'LOCAL_KERNEL', desc: 'SUB_FIREWALL patch compiled and deployed. System security increased.', status: 'BLOCKED' },
      ...prev
    ]);
  };

  const handleJamOmegaNodes = () => {
    if (state.player.cash < 450000000) {
      onLogTerminal('REJECTED: Insufficient finance reserves ($450M required) for OMEGA hardware jam.', true);
      playSyntheticSound('warning');
      return;
    }

    onModifyState((prev) => {
      const next = { ...prev };
      next.player.cash -= 450000000;
      next.omegaThreatLevel = Math.max(5, next.omegaThreatLevel - 20);
      onLogTerminal('ATTACK SURGE COMPLETED: Scrambled hardware trace node logic over OMEGA cores.');
      playSyntheticSound('alert');
      return next;
    });

    const timeStr = new Date().toTimeString().split(' ')[0];
    setCyberLogs((prev) => [
      { time: timeStr, source: 'OMEGA_JAMMER', desc: 'Hardware jamming burst launched. OMEGA tracking systems disrupted.', status: 'ALERT' },
      ...prev
    ]);
  };

  const handlePurgeSubnet = () => {
    if (state.player.cash < 100000000) {
      onLogTerminal('REJECTED: Insufficient cash ($100M required) for quick subnet purge.', true);
      playSyntheticSound('warning');
      return;
    }

    onModifyState((prev) => {
      const next = { ...prev };
      next.player.cash -= 100000000;
      next.omegaThreatLevel = Math.max(5, next.omegaThreatLevel - 5);
      next.neuralFirewallPower = Math.min(100, next.neuralFirewallPower + 10);
      onLogTerminal('SUBNET PURGED: Memory buffers cleared. System resources recovered.');
      playSyntheticSound('success');
      return next;
    });

    const timeStr = new Date().toTimeString().split(' ')[0];
    setCyberLogs((prev) => [
      { time: timeStr, source: 'SUBNET_PURGER', desc: 'Wiped local caches and memory buffers of pending tracing logs.', status: 'PURGED' },
      ...prev
    ]);
  };

  const handleOverclockHalc = () => {
    if (state.player.cash < 200000000) {
      onLogTerminal('REJECTED: Insufficient cash ($200M required) to overclock HALC-core telemetry.', true);
      playSyntheticSound('warning');
      return;
    }

    onModifyState((prev) => {
      const next = { ...prev };
      next.player.cash -= 200000000;
      next.researchPoints = (next.researchPoints || 0) + 160;
      next.omegaThreatLevel = Math.min(100, next.omegaThreatLevel + 6);
      onLogTerminal('HALC CORES OVERCLOCKED: Intercepting data streams at critical throughputs. +160 Research. OMEGA active tracking spiked.');
      playSyntheticSound('click');
      return next;
    });

    const timeStr = new Date().toTimeString().split(' ')[0];
    setCyberLogs((prev) => [
      { time: timeStr, source: 'COGNITIVE_ACCEL', desc: 'Capped data harvesting buffers from high-altitude array scans.', status: 'WARNING' },
      ...prev
    ]);
  };

  const threatLevel = state.omegaThreatLevel || 15;
  const firewallPower = state.neuralFirewallPower ?? 50;

  return (
    <div className="flex flex-col h-full overflow-hidden select-none font-mono text-xs text-[#ff3b5c] bg-[#07090d]">
      
      {/* HEADER BAR */}
      <div className="flex justify-between items-center bg-[#0f1318] border border-[#1e2535] p-2 rounded-terminal mb-1.5 shadow-[inset_0_1px_3px_rgba(0,0,0,0.6)] font-semibold text-[10px]">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 bg-red-600 animate-ping rounded-full" />
          <span className="tracking-wider uppercase text-red-500">// OMEGA INTRUSION TRACE CONSOLE // LIVE TRACING ACTIVE</span>
        </div>
        <span className="text-cyan-400 font-bold">FIREWALL CORE SECURITY LEVEL 4</span>
      </div>

      <div className="flex-1 bg-[#07090d] border border-[#1e2535] p-3 rounded-terminal flex flex-col lg:flex-row gap-3 overflow-hidden">
        
        {/* NEURAL TOPOLOGY NETWORK DISPLAY */}
        <div className="flex-1 bg-[#0a0c0f] border border-[#1e2535] rounded-terminal p-3 flex flex-col justify-between relative min-h-[220px]">
          
          <div className="flex justify-between items-center text-[8.5px] text-slate-500 uppercase tracking-widest font-terminal">
            <span>// CYBER TRACE TOPOLOGY LINK-WAY MATRIX</span>
            <span className="text-red-500 font-bold animate-pulse">OVERWATCH ON</span>
          </div>

          {/* ACTIVE ANIMATED SCAN SYSTEM VECTOR AREA */}
          <div className="relative flex-1 w-full my-1 border border-[#1e2535]/35 rounded bg-[#030406] overflow-hidden min-h-[160px]">
            
            {/* Smooth moving horizontal scanline */}
            <div 
              className="absolute left-0 right-0 h-0.5 bg-red-650/45 shadow-[0_0_10px_#ff3b5c] z-10 pointer-events-none" 
              style={{ top: `${scanOffset}%`, transition: 'top 0.15s linear' }}
            />

            <svg viewBox="0 0 500 240" className="w-full h-full text-slate-800">
              {/* Complex topology grid background paths */}
              <path d="M 50 40 Q 250 120 450 40" fill="none" className="stroke-red-950/40 stroke-[0.8]" strokeDasharray="3 3" />
              <path d="M 50 200 Q 250 120 450 200" fill="none" className="stroke-red-950/45 stroke-[0.8]" strokeDasharray="5 5" />
              <path d="M 50 40 Q 250 120 450 200" fill="none" className="stroke-red-900/15 stroke-1" />
              <path d="M 50 200 Q 250 120 450 40" fill="none" className="stroke-red-900/15 stroke-1" />

              {/* Central vector radiating nodes */}
              <circle cx="250" cy="120" r={pingPulse ? 24 : 15} className="fill-none stroke-red-600/30 stroke-1 transition-all duration-300" />
              <circle cx="250" cy="120" r="14" className="fill-red-950/60 stroke-red-500 stroke-2 animate-pulse" />
              <text x="225" y="92" className="text-[8.5px] fill-red-500 font-black tracking-widest font-mono">OMEGA_V2</text>

              {/* Subnet Nodes on Map */}
              {/* Node 1: US */}
              <circle cx="80" cy="50" r="9" className="fill-slate-900 stroke-red-600/60 stroke-1" />
              <text x="60" y="36" className="text-[7.5px] fill-slate-400 font-bold font-mono">US-SECT7</text>
              <line x1="80" y1="50" x2="250" y2="120" className="stroke-red-600/25 stroke-[1]" strokeDasharray="2, 4" />
              
              {/* Node 2: EU */}
              <circle cx="80" cy="190" r="9" className="fill-slate-900 stroke-cyan-500/50 stroke-1" />
              <text x="60" y="210" className="text-[7.5px] fill-cyan-400/80 font-bold font-mono">EU-MAIN3</text>
              <line x1="80" y1="190" x2="250" y2="120" className="stroke-cyan-500/15 stroke-[0.8]" />

              {/* Node 3: CN */}
              <circle cx="420" cy="50" r="9" className="fill-slate-900 stroke-orange-500/40 stroke-1" />
              <text x="400" y="36" className="text-[7.5px] fill-orange-400/80 font-bold font-mono">CN_GATE</text>
              <line x1="420" y1="50" x2="250" y2="120" className="stroke-orange-500/20 stroke-[1]" />

              {/* Node 4: CH */}
              <circle cx="420" cy="190" r="9" className="fill-emerald-950 stroke-emerald-500 stroke-2" />
              <text x="400" y="210" className="text-[7.5px] fill-emerald-400 font-black font-terminal">CH_SECURE</text>
              <line x1="420" y1="190" x2="250" y2="120" className="stroke-emerald-500/50 stroke-[1]" />

              {/* Dynamic drifting packets */}
              {pingPulse && (
                <circle cx="160" cy="85" r="2.5" className="fill-red-500 animate-ping" />
              )}
              {!pingPulse && (
                <circle cx="330" cy="155" r="2.5" className="fill-emerald-400 animate-ping" />
              )}
            </svg>
          </div>

          <div className="flex justify-between items-center text-[9px] border-t border-[#1e2535] pt-1.5 font-terminal mt-1">
            <span className="text-red-400/80 italic animate-pulse">CRITICAL THREAT ATTEMPTS FLAGGED CONTINUOUSLY</span>
            <div className="flex gap-4">
              <span>LEAK RATIO: <span className="text-white font-bold">{leakageRatio.toFixed(2)}%</span></span>
              <span>PACKET INDEX: <span className="text-white font-bold">{packetRate} P/S</span></span>
            </div>
          </div>
        </div>

        {/* CONTROLS & TRACE TELEMETRY */}
        <div className="w-full lg:w-[260px] xl:w-[310px] shrink-0 flex flex-col gap-2 uppercase">
          
          {/* Live Telemetry Data Box */}
          <div className="bg-[#141920] border border-[#1e2535] p-2.5 rounded-terminal font-terminal">
            <span className="text-[8px] text-slate-400 block mb-1.5 font-bold">// OMEGA GLOBAL SYSTEM STATE</span>
            <div className="grid grid-cols-2 gap-2 text-[9px] text-[#ff3b5c]">
              <div className="p-1.5 bg-[#0a0c0f] border border-[#1e2535] rounded flex flex-col">
                <span className="text-[7px] text-slate-400 font-bold">THREAT INDEX</span>
                <span className="text-[14px] font-black tracking-tight">{threatLevel.toFixed(1)}%</span>
              </div>
              <div className="p-1.5 bg-[#0a0c0f] border border-[#1e2535] rounded flex flex-col">
                <span className="text-[7px] text-slate-400 font-bold">FIREWALL INTG</span>
                <span className="text-[14px] font-black text-[#00ff88] tracking-tight">{firewallPower}%</span>
              </div>
              <div className="col-span-2 p-1 bg-[#0a0c0f] border border-[#1e2535] rounded text-[8px] text-slate-400 truncate flex justify-between px-2">
                <span>ACTIVE STRIKES:</span>
                <span className="font-bold text-red-500 font-terminal">
                  {state.omegaActiveAttacks && state.omegaActiveAttacks.length > 0 ? state.omegaActiveAttacks.join(', ') : 'NONE_DETECTED'}
                </span>
              </div>
            </div>
          </div>

          {/* Expanded Cyber Defenses and Accels */}
          <div className="bg-[#141920] border border-[#1e2535] p-2.5 rounded-terminal flex-1 flex flex-col justify-between font-terminal">
            <div>
              <span className="text-[8px] text-slate-400 block mb-1.5 font-bold">// DEFENSIVE PROTOCOLS DESK</span>
              <div className="space-y-1">
                
                <button
                  onClick={handleSubFirewall}
                  disabled={state.player.cash < 250000000}
                  className={`w-full text-left p-1.5 border border-cyan-800 bg-[#0a0c0f] hover:bg-cyan-950/20 text-[#00c2ff] rounded flex justify-between items-center cursor-pointer transition-colors ${state.player.cash < 250000000 ? 'opacity-35 cursor-not-allowed' : ''}`}
                >
                  <div>
                    <div className="text-[9px] font-bold">BOOST SUB_FIREWALL</div>
                    <div className="text-[7px] text-[#00c2ff]/65">DEPLOY PATSUB NETCHECKS // +25% FIREWALL</div>
                  </div>
                  <span className="text-[8px] font-black text-[#00c2ff] font-mono shrink-0">$250.0M</span>
                </button>

                <button
                  onClick={handleJamOmegaNodes}
                  disabled={state.player.cash < 450000000}
                  className={`w-full text-left p-1.5 border border-red-700 bg-[#0a0c0f] hover:bg-red-950/20 text-red-400 rounded flex justify-between items-center cursor-pointer transition-colors ${state.player.cash < 450000000 ? 'opacity-35 cursor-not-allowed' : ''}`}
                >
                  <div>
                    <div className="text-[9px] font-bold">JAM OMEGA NODES</div>
                    <div className="text-[7px] text-red-400/65">ELECTROMAGNETIC PULSES // -20% THREAT</div>
                  </div>
                  <span className="text-[8px] font-black text-red-400 font-mono shrink-0">$450.0M</span>
                </button>

                <button
                  onClick={handlePurgeSubnet}
                  disabled={state.player.cash < 100000000}
                  className={`w-full text-left p-1.5 border border-emerald-800 bg-[#0a0c0f] hover:bg-emerald-950/20 text-emerald-400 rounded flex justify-between items-center cursor-pointer transition-colors ${state.player.cash < 100000000 ? 'opacity-35 cursor-not-allowed' : ''}`}
                >
                  <div>
                    <div className="text-[9px] font-bold">PURGE KERNEL SUBNET</div>
                    <div className="text-[7px] text-emerald-400/65">WIPE CACHES & OVERFLOW MEM // REGEN HEALTH</div>
                  </div>
                  <span className="text-[8px] font-black text-emerald-400 font-mono shrink-0">$100.0M</span>
                </button>

                <button
                  onClick={handleOverclockHalc}
                  disabled={state.player.cash < 200000000}
                  className={`w-full text-left p-1.5 border border-yellow-750 bg-[#0a0c0f] hover:bg-yellow-950/20 text-yellow-500 rounded flex justify-between items-center cursor-pointer transition-colors ${state.player.cash < 200000000 ? 'opacity-35 cursor-not-allowed' : ''}`}
                >
                  <div>
                    <div className="text-[9px] font-bold">OVERCLOCK HALC-CORE</div>
                    <div className="text-[7px] text-yellow-500/65">SIPHON EXPERIMENTAL METRICS // +160 RES</div>
                  </div>
                  <span className="text-[8px] font-black text-yellow-500 font-mono shrink-0">$200.0M</span>
                </button>

              </div>
            </div>
          </div>

          {/* Incident stream reports console */}
          <div className="bg-[#0b0e14] border border-[#1e2535] p-2 rounded-terminal font-terminal h-[110px] flex flex-col justify-between overflow-hidden">
            <span className="text-[8px] text-slate-500 border-b border-[#1e2535] pb-0.5 mb-1 flex justify-between block font-bold">
              <span>// CYBER TRACE AUDITS STREAM</span>
              <span className="text-red-500 font-bold animate-pulse">● LIVE_FEED</span>
            </span>
            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 font-mono text-[7.5px] leading-snug">
              {cyberLogs.map((log, index) => {
                let badgeColor = 'text-slate-400';
                if (log.status === 'BLOCKED') badgeColor = 'text-cyan-400 font-bold';
                if (log.status === 'ALERT') badgeColor = 'text-red-400 font-black animate-pulse';
                if (log.status === 'WARNING') badgeColor = 'text-yellow-400';
                if (log.status === 'PURGED') badgeColor = 'text-emerald-400';

                return (
                  <div key={index} className="flex gap-1.5 items-start">
                    <span className="text-slate-600 shrink-0">{log.time}</span>
                    <span className={`${badgeColor} shrink-0 font-bold`}>[{log.source}]</span>
                    <p className="text-slate-300 truncate">{log.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
