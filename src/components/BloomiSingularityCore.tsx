import React, { useEffect, useRef, useState } from 'react';
import { SimState } from '../types';
import { playSyntheticSound } from '../utils/audio';
import { 
  ShieldAlert, 
  Globe, 
  Terminal, 
  Cpu, 
  TrendingUp, 
  Zap, 
  Skull, 
  Database, 
  Radio, 
  AlertTriangle,
  Play,
  RotateCcw,
  Layers,
  LineChart,
  Eye,
  Lock,
  Compass,
  Briefcase
} from 'lucide-react';

interface BloomiSingularityCoreProps {
  state: SimState;
  setGameState: React.Dispatch<React.SetStateAction<SimState | null>>;
  executeCommand: (command: string) => void;
  logToTerminal: (msg: string, isErr?: boolean) => void;
  activeTicker: string;
  onSetTicker: (ticker: string) => void;
}

interface NexusNode {
  id: string;
  label: string;
  category: 'bank' | 'corporate' | 'political' | 'dyg' | 'omega';
  risk: number;
  latitude: string;
  longitude: string;
  connections: string[];
  description: string;
  sentiment: 'positive' | 'negative' | 'volatile';
  intelLevel: number;
}

export const BloomiSingularityCore: React.FC<BloomiSingularityCoreProps> = ({
  state,
  setGameState,
  executeCommand,
  logToTerminal,
  activeTicker,
  onSetTicker
}) => {
  const [selectedNodeId, setSelectedNodeId] = useState<string>('omega_core');
  const [cliBuffer, setCliBuffer] = useState<string>('');
  const [activeDecayTracks, setActiveDecayTracks] = useState<number>(3);
  const [shakeIntensity, setShakeIntensity] = useState<number>(0);
  const [hftGates, setHftGates] = useState<string[]>(['cds_reaper']);
  const [glitchActive, setGlitchActive] = useState<boolean>(false);
  const [hftMode, setHftMode] = useState<'IDLE' | 'ARBITRAGE' | 'ATTACK'>('ARBITRAGE');
  
  const graphCanvasRef = useRef<HTMLCanvasElement>(null);
  const orbitalCanvasRef = useRef<HTMLCanvasElement>(null);
  const commandEndRef = useRef<HTMLDivElement>(null);

  // Entities & Network Topology Nodes
  const nodes: NexusNode[] = [
    {
      id: 'us_fed',
      label: 'FED Sovereign Ledger',
      category: 'bank',
      risk: 42,
      latitude: '38°53\'22"N',
      longitude: '77°02\'06"W',
      connections: ['vanguard_blackrock', 'player_dynasty', 'omega_core'],
      description: 'US Federal Reserve Board operations. Overseeing dollar-pegged liquidity injections and domestic interest rates.',
      sentiment: 'volatile',
      intelLevel: 85
    },
    {
      id: 'vanguard_blackrock',
      label: 'Vanguard Alpha Syndicate',
      category: 'corporate',
      risk: 68,
      latitude: '40°00\'32"N',
      longitude: '75°16\'38"W',
      connections: ['us_fed', 'chevron_energy', 'omega_core'],
      description: 'Global asset aggregation framework holding major board control of defense, logistics, and central financial sectors.',
      sentiment: 'negative',
      intelLevel: 62
    },
    {
      id: 'chevron_energy',
      label: 'Chevron Energy Oligopoly',
      category: 'corporate',
      risk: 55,
      latitude: '37°47\'50"N',
      longitude: '122°24\'27"W',
      connections: ['vanguard_blackrock', 'suez_logistics'],
      description: 'Primary energy contractor routing physical fuel pipelines across NATO territories.',
      sentiment: 'volatile',
      intelLevel: 45
    },
    {
      id: 'suez_logistics',
      label: 'Suez Shipping Corridor',
      category: 'political',
      risk: 89,
      latitude: '29°58\'06"N',
      longitude: '32°31\'55"E',
      connections: ['chevron_energy', 'player_dynasty', 'omega_core'],
      description: 'Critical maritime chokepoint. Shipping channels subject to local drone interventions and sovereign blockades.',
      sentiment: 'negative',
      intelLevel: 94
    },
    {
      id: 'omega_core',
      label: 'OMEGA Core Singularity AI',
      category: 'omega',
      risk: state.omegaThreatLevel || 15,
      latitude: '00°00\'00"N',
      longitude: '00°00\'00"E',
      connections: ['us_fed', 'vanguard_blackrock', 'suez_logistics', 'ecb_central', 'player_dynasty'],
      description: 'Hyper-conscious synthetic sovereign entity. Actively attacking global credit sheets and injecting cyber entropy.',
      sentiment: 'volatile',
      intelLevel: 100
    },
    {
      id: 'ecb_central',
      label: 'ECB Sovereign Vault',
      category: 'bank',
      risk: 31,
      latitude: '50°06\'34"N',
      longitude: '08°41\'11"E',
      connections: ['omega_core', 'rothschild_dynasty'],
      description: 'European Central Bank sovereign bond desk. Managing euro capital stress levels against global leverage bubbles.',
      sentiment: 'positive',
      intelLevel: 75
    },
    {
      id: 'rothschild_dynasty',
      label: 'Rothschild Capital Trust',
      category: 'political',
      risk: 28,
      latitude: '48°51\'24"N',
      longitude: '02°21\'08"E',
      connections: ['ecb_central', 'player_dynasty'],
      description: 'Historic sovereign capital aggregate. Running multi-generational arbitrage programs over continental treasuries.',
      sentiment: 'positive',
      intelLevel: 50
    },
    {
      id: 'player_dynasty',
      label: 'My Dynasty Central Vault',
      category: 'dyg',
      risk: 15,
      latitude: '47°22\'00"N',
      longitude: '08°33\'00"E',
      connections: ['us_fed', 'suez_logistics', 'omega_core', 'rothschild_dynasty'],
      description: 'Active digital war chest. Sourcing high-frequency assets, staff operatives, and deep planetary leverage tools.',
      sentiment: 'positive',
      intelLevel: 100
    }
  ];

  const nodePositions: Record<string, { x: number; y: number }> = {
    us_fed: { x: 100, y: 80 },
    vanguard_blackrock: { x: 110, y: 190 },
    chevron_energy: { x: 230, y: 240 },
    suez_logistics: { x: 340, y: 210 },
    omega_core: { x: 250, y: 140 },
    ecb_central: { x: 380, y: 80 },
    rothschild_dynasty: { x: 280, y: 50 },
    player_dynasty: { x: 200, y: 400 }
  };

  // Node Click Handlers
  const handleNodeClick = (nodeId: string) => {
    setSelectedNodeId(nodeId);
    playSyntheticSound('tick');
    logToTerminal(`PALANTIR: Resolved intelligence dossier for [${nodes.find(n => n.id === nodeId)?.label}].`);
  };

  // Triggers visual shake/glitch
  useEffect(() => {
    const isThreatLevelSevere = (state.omegaThreatLevel || 0) > 65;
    if (isThreatLevelSevere) {
      setShakeIntensity(2);
      const interval = setInterval(() => {
        setGlitchActive(true);
        setTimeout(() => setGlitchActive(false), 220);
      }, 5000);
      return () => clearInterval(interval);
    } else {
      setShakeIntensity(0);
      setGlitchActive(false);
    }
  }, [state.omegaThreatLevel]);

  // Command input handlers
  const handleCliSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cliBuffer.trim()) return;
    
    const command = cliBuffer.trim();
    setCliBuffer('');
    playSyntheticSound('order');

    // Parse commands locally first for custom feedback
    const tokens = command.toLowerCase().split(/\s+/);
    if (tokens[0] === '/buy' || tokens[0] === '/short') {
      const ticker = (tokens[1] || 'APLH').toUpperCase();
      const amount = parseInt(tokens[2] || '1000');
      const mockPrice = state.markets[ticker]?.currentPrice || 100;
      
      if (tokens[0] === '/buy') {
        const cmdString = `BUY ${ticker} ${mockPrice.toFixed(2)} ${amount} GO`;
        executeCommand(cmdString);
      } else {
        const cmdString = `SELL ${ticker} ${mockPrice.toFixed(2)} ${amount} GO`;
        executeCommand(cmdString);
      }
    } else if (tokens[0] === '/firewall' && tokens[1] === 'boost') {
      executeCommand('AI_WAR');
      executeCommand('BOOST SUB_FIREWALL (-$250M)');
    } else if (tokens[0] === '/dossier') {
      const searchNode = nodes.find(n => n.label.toLowerCase().includes(tokens[1] || ''));
      if (searchNode) {
        setSelectedNodeId(searchNode.id);
        logToTerminal(`PALANTIR: Deep scan located: ${searchNode.label}`);
      } else {
        logToTerminal(`PALANTIR: Entity search term [${tokens[1]}] not resolved.`, true);
      }
    } else {
      // Direct raw command feed-through
      executeCommand(command);
    }
  };

  // Render Network Graph (Palantir style Canvas)
  useEffect(() => {
    const canvas = graphCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    // Map dimensions carefully
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#05070a';
    ctx.fillRect(0, 0, w, h);

    // Dynamic grid lattice
    ctx.strokeStyle = '#0e121a';
    ctx.lineWidth = 0.5;
    for (let x = 0; x < w; x += 25) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    }
    for (let y = 0; y < h; y += 25) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }

    // Adapt coordinates relative to container width
    const mapCoords = (id: string) => {
      const pos = nodePositions[id] || { x: 50, y: 50 };
      // Map positions relative to a reference 400x450 coordinate space
      return {
        x: (pos.x / 410) * (w - 40) + 20,
        y: (pos.y / 460) * (h - 40) + 20
      };
    };

    // Draw active kinetic connection beziers with arrow particles
    ctx.lineWidth = 1;
    const timeFactor = (Date.now() * 0.0015) % 1.0;

    nodes.forEach((node) => {
      const fromPos = mapCoords(node.id);
      node.connections.forEach((connId) => {
        const toPos = mapCoords(connId);
        
        ctx.strokeStyle = node.id === selectedNodeId || connId === selectedNodeId 
          ? 'rgba(0, 194, 255, 0.45)' 
          : 'rgba(30, 41, 59, 0.6)';
        
        ctx.beginPath();
        ctx.moveTo(fromPos.x, fromPos.y);
        ctx.lineTo(toPos.x, toPos.y);
        ctx.stroke();

        // Draw dynamic pulsing beads on these connectors to show asset/liquidity flows
        const particleX = fromPos.x + (toPos.x - fromPos.x) * timeFactor;
        const particleY = fromPos.y + (toPos.y - fromPos.y) * timeFactor;
        ctx.fillStyle = node.id === 'omega_core' ? '#ff3b5c' : '#00ff88';
        ctx.beginPath();
        ctx.arc(particleX, particleY, 2.2, 0, Math.PI * 2);
        ctx.fill();
      });
    });

    // Draw nodes
    nodes.forEach((node) => {
      const pos = mapCoords(node.id);
      const isSelected = node.id === selectedNodeId;

      // Color code by category
      let color = '#38bdf8'; // corporate
      if (node.category === 'bank') color = '#fbbf24'; // yellow
      if (node.category === 'political') color = '#a78bfa'; // purple
      if (node.category === 'omega') color = '#ff3b5c'; // red
      if (node.category === 'dyg') color = '#10b981'; // green

      // Outer glow boundary
      if (isSelected) {
        ctx.shadowColor = color;
        ctx.shadowBlur = 10;
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 11, 0, Math.PI * 2);
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      // Inner node circle
      ctx.fillStyle = isSelected ? color : '#111827';
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 6.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Mini text labels
      ctx.fillStyle = isSelected ? '#ffffff' : '#94a3b8';
      ctx.font = 'bold 8px monospace';
      ctx.textAlign = 'center';
      
      // Print short ticker or abbreviation for labels
      const shortLabel = node.label.split(' ')[0] || node.label;
      ctx.fillText(shortLabel, pos.x, pos.y - 12);
    });

  }, [selectedNodeId, graphCanvasRef.current]);

  // Render Simulated Satellite Lane (Middle Column top)
  useEffect(() => {
    const canvas = orbitalCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animFrame: number;
    let sweepAngle = 0;

    const drawOrbital = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = 100 * dpr;
      ctx.scale(dpr, dpr);

      const w = rect.width;
      const h = 100;

      ctx.fillStyle = '#06080c';
      ctx.fillRect(0, 0, w, h);

      // Radar rings
      const cx = w / 2;
      const cy = h / 2;
      ctx.strokeStyle = '#0e1d2d';
      ctx.lineWidth = 0.8;
      ctx.beginPath(); ctx.arc(cx, cy, 25, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.arc(cx, cy, 45, 0, Math.PI * 2); ctx.stroke();

      // Sweeper arm
      sweepAngle += 0.02;
      ctx.strokeStyle = 'rgba(0, 194, 255, 0.25)';
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(sweepAngle) * 60, cy + Math.sin(sweepAngle) * 60);
      ctx.stroke();

      // Tech details
      ctx.fillStyle = 'rgba(0, 194, 255, 0.7)';
      ctx.font = '7.5px monospace';
      ctx.fillText(`SAT_ORBIT_ID: SATELLITE_ORBITA_III`, 10, 15);
      ctx.fillText(`GEO_LOCK_TARGET: [${nodes.find(n => n.id === selectedNodeId)?.latitude}]`, 10, 25);
      ctx.fillText(`SWEEP_COEF: ${((sweepAngle * 10) % 100).toFixed(2)}%`, 10, 35);
      ctx.fillText(`ALTITUDE: 35,786 KM`, w - 95, 15);
      
      // Scanning coordinates crosshair cursor
      ctx.strokeStyle = 'rgba(0, 255, 136, 0.4)';
      ctx.beginPath();
      ctx.moveTo(cx - 3, cy); ctx.lineTo(cx + 3, cy);
      ctx.moveTo(cx, cy - 3); ctx.lineTo(cx, cy + 3);
      ctx.stroke();

      animFrame = requestAnimationFrame(drawOrbital);
    };

    drawOrbital();
    return () => cancelAnimationFrame(animFrame);
  }, [selectedNodeId]);

  // Handle auto scrolling for logs in column 3
  useEffect(() => {
    commandEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [state.chatLogs, state.currentTick]);

  const activeNode = nodes.find(n => n.id === selectedNodeId) || nodes[4];

  return (
    <div className={`flex flex-col h-[calc(100vh-175px)] text-white select-none relative ${shakeIntensity > 0 ? 'animate-shake' : ''} ${glitchActive ? 'filter brightness-125 contrast-125 opacity-90 transition-all font-mono' : ''}`}>
      
      {/* Glitch CRT Scanlines layer */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-black/10 to-transparent bg-[length:100%_4px] opacity-[0.22] z-50 mix-blend-overlay" />
      
      {/* Dynamic Status / Decibel Bar Header info */}
      <div className="flex items-center justify-between border-b border-[#00c2ff]/30 bg-[#0a0f18] px-3 py-1.5 text-[10px] font-bold text-[#00c2ff]">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4.5 h-4.5 text-red-500 animate-pulse" />
          <span>PROJECT BLOOMI // CENTRAL INTELLIGENCE RADAR WORKSPACE</span>
        </div>
        <div className="flex gap-4 font-mono text-[9px]">
          <span>RISK LEVEL: <span className="text-red-500 font-extrabold">{activeNode.risk}%</span></span>
          <span>VAL_AT_RISK (VaR): <span className="text-orange-450">${((state.player.cash * 1.65 / 1e6) * (activeNode.risk / 100)).toFixed(1)}M</span></span>
          <span className="text-slate-500">// SEC_BYPASS_ENGAGED</span>
        </div>
      </div>

      {/* THREE COLUMN LAYOUT BASE */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-2 p-2 overflow-hidden h-full">

        {/* COLUMN 1: Nexus Graph (Palantir style Node Resolver) */}
        <div className="bg-[#040609] border border-[#00c2ff]/20 rounded-terminal flex flex-col overflow-hidden h-full">
          <div className="flex items-center justify-between bg-[#080d16] border-b border-[#00c2ff]/20 px-2.5 py-1 text-[9px] font-bold uppercase text-[#00c2ff]">
            <div className="flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5" />
              <span>NEXUS RESOLUTION MAP</span>
            </div>
            <span className="text-slate-500 font-normal">Palantir Enterprise Mode</span>
          </div>

          <div className="flex-1 relative overflow-hidden bg-black min-h-[180px]">
            <canvas ref={graphCanvasRef} className="absolute inset-0 block w-full h-full" />
            
            {/* Interactive entity markers on the overlay map */}
            <div className="absolute bottom-2 left-2 flex flex-col gap-0.5 text-[8.5px] font-mono text-slate-500 bg-[#05070a]/90 border border-slate-800 p-1.5 rounded uppercase pointer-events-none">
              <div className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#10b981]" /> Player Dynasty Node</div>
              <div className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#ff3b5c]" /> OMEGA Singularity AI</div>
              <div className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#fbbf24]" /> Central Bank Ledger</div>
              <div className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#38bdf8]" /> Transnational Corporate</div>
            </div>
          </div>

          {/* PALANTIR DEEP DOSSIER OVERLAY FOR THE ACTIVE NODE */}
          <div className="bg-[#070b12] border-t border-[#00c2ff]/20 p-2.5 font-terminal uppercase text-[10px] space-y-2 select-text">
            <h4 className="font-bold text-[#fbbf24] flex items-center justify-between border-b border-white/10 pb-1 text-[10px]">
              <span>[DEEP SYSTEM DOSSIER] - {activeNode.label}</span>
              <span className="text-[8.5px] text-slate-500">ID: {activeNode.id}</span>
            </h4>

            <p className="normal-case text-slate-300 leading-relaxed text-[9.5px]/1.4 mb-2">
              {activeNode.description}
            </p>

            <div className="grid grid-cols-2 gap-2 text-[8px] bg-black/40 p-1.5 border border-white/5 rounded">
              <div>
                <span className="text-slate-500 block">RISK FACTOR INDEX:</span>
                <span className={`font-bold text-xs ${activeNode.risk > 60 ? 'text-[#ff3b5c]' : activeNode.risk > 35 ? 'text-orange-400' : 'text-[#00ff88]'}`}>
                  {activeNode.risk}% INDX
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">STABILIZATION RATE:</span>
                <span className="text-white font-bold text-xs">{(100 - activeNode.risk).toFixed(1)} PVE</span>
              </div>
              <div>
                <span className="text-slate-500 block">COORD LATS:</span>
                <span className="text-[#00c2ff] font-bold">{activeNode.latitude}</span>
              </div>
              <div>
                <span className="text-slate-500 block">COORD LONS:</span>
                <span className="text-[#00c2ff] font-bold">{activeNode.longitude}</span>
              </div>
            </div>

            {/* Simulated Satellite Lane scanning and Social Sentiment Heatmap */}
            <div className="space-y-1.5 pt-1.5">
              <div>
                <span className="text-slate-500 block text-[8px]">SOCIAL SENTIMENT POLARITY MATRIX:</span>
                <div className="h-2 bg-slate-950 rounded border border-white/10 overflow-hidden relative flex mt-1">
                  {activeNode.sentiment === 'positive' && (
                    <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 w-[78%] animate-pulse" />
                  )}
                  {activeNode.sentiment === 'negative' && (
                    <div className="h-full bg-gradient-to-r from-red-600 to-[#ff3b5c] w-[84%]" />
                  )}
                  {activeNode.sentiment === 'volatile' && (
                    <>
                      <div className="h-full bg-amber-500 w-[35%]" />
                      <div className="h-full bg-[#ff3b5c] w-[25%]" />
                      <div className="h-full bg-emerald-500 w-[20%]" />
                    </>
                  )}
                </div>
                <div className="flex justify-between text-[7.5px] text-slate-500 mt-0.5 font-mono">
                  <span>-100 BEARISH</span>
                  <span className="text-[#00ff88] font-bold">SENTIMENT: {activeNode.sentiment.toUpperCase()}</span>
                  <span>+100 BULLISH</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* COLUMN 2: Market Collider (CERN style dual cyclotron tracking & Gauges) */}
        <div className="bg-[#040609] border border-[#00c2ff]/20 rounded-terminal flex flex-col overflow-hidden h-full">
          <div className="flex items-center justify-between bg-[#080d16] border-b border-[#00c2ff]/20 px-2.5 py-1 text-[9px] font-bold uppercase text-[#00c2ff]">
            <div className="flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-[#00ff88]" />
              <span>CERN COLLIDER SYMMETRIES</span>
            </div>
            <span className="text-slate-500 font-normal">LHC Telemetry Engine</span>
          </div>

          {/* Satellite Lane Radar scanner sweep (Palantir Object Intelligence) */}
          <div className="border-b border-[#00c2ff]/20 h-[100px] relative shrink-0">
            <canvas ref={orbitalCanvasRef} className="absolute inset-0 block w-full h-full" />
          </div>

          <div className="flex-1 overflow-y-auto p-2.5 space-y-3 font-terminal uppercase text-[10px]">
            {/* Oscillating Gauges: Replacement of typical progress bars with live sines */}
            <div className="bg-black/30 border border-[#1e2535] p-2.5 rounded relative space-y-2">
              <h5 className="font-bold text-[9px] text-[#00c2ff] flex justify-between items-center select-none border-b border-[#1e2535] pb-1">
                <span>VOLATILITY WAVE OSCILLOSCOPIC TELEMETRY</span>
                <span className="text-[#00ff88] animate-pulse">SINE_WAVE_ACTV</span>
              </h5>

              {/* High-frequency wave generator component */}
              <div className="h-[45px] bg-[#030508] border border-white/5 relative rounded flex items-center justify-center overflow-hidden">
                <svg className="w-full h-full" viewBox="0 0 300 40">
                  <path 
                    d={`M 0,20 Q 25,${20 - Math.sin(state.currentTick * 0.1) * 15} 50,20 T 100,20 T 150,20 T 200,20 T 250,20 T 300,20`}
                    className="stroke-[#00ff88] fill-none stroke-1 opacity-70 animate-pulse"
                  />
                  <path 
                    d={`M 0,20 Q 15,${20 + Math.cos(state.currentTick * 0.15) * 16} 40,20 T 80,20 T 120,20 T 160,20 T 200,20 T 240,20 T 280,20 T 300,20`}
                    className="stroke-[#00c2ff] fill-none stroke-1 opacity-45"
                  />
                </svg>
                <div className="absolute top-1 text-[7.5px] text-slate-500 font-mono left-1">WAVE_OFFSET_AMP: 32.4 Pts</div>
                <div className="absolute bottom-1 text-[7.5px] text-slate-500 font-mono right-1">LAMBDA_COEF: 0.14</div>
              </div>

              <div className="grid grid-cols-2 gap-1.5 pt-1 text-[9px]">
                <div className="bg-black/60 p-1.5 border border-white/5 rounded font-mono">
                  <div className="text-slate-500">DECAY RATES COEF</div>
                  <div className="text-white font-bold">1.442e-12 / SEC</div>
                </div>
                <div className="bg-black/60 p-1.5 border border-white/5 rounded font-mono">
                  <div className="text-slate-500">ENERGY BAR EXPONENT</div>
                  <div className="text-[#00ff88] font-bold">{(4.2 * Math.cos(state.currentTick * 0.05) + 20).toFixed(2)} TeV</div>
                </div>
              </div>
            </div>

            {/* Colliding dual beams interactive block */}
            <div className="bg-black/30 border border-[#1e2535] p-2.5 rounded space-y-2">
              <h5 className="font-bold text-[9.5px] text-white/95">CYCLOTRON ASSET HADRON DECAYS</h5>
              
              <div className="space-y-1.5 text-[9px]">
                <div>
                  <div className="flex justify-between items-center text-[#00c2ff] mb-1">
                    <span>BEAM ALPH: {activeTicker} LONG BEAM</span>
                    <span>100% EXCITATED</span>
                  </div>
                  <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-emerald-500 to-[#00ff88] w-[88%]" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center text-red-400 mb-1">
                    <span>BEAM BETA: OMEGA SQUEEZE BEAM</span>
                    <span>{(state.omegaThreatLevel || 15).toFixed(0)}% AMPLIFIED</span>
                  </div>
                  <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-[#ff3b5c] transition-all" style={{ width: `${Math.min(100, Math.max(10, state.omegaThreatLevel || 15))}%` }} />
                  </div>
                </div>
              </div>

              {/* Hadron force control button */}
              <button
                onClick={() => {
                  setGameState(prev => {
                    if (!prev) return prev;
                    const next = { ...prev };
                    next.omegaThreatLevel = Math.min(100, (next.omegaThreatLevel || 15) + 5);
                    logToTerminal('CERN: Hadron Collider beam collision forced. Decay debris scattered!');
                    playSyntheticSound('liquidation');
                    return next;
                  });
                }}
                className="w-full bg-red-950/20 hover:bg-red-900/30 border border-red-700/50 text-red-400 text-center text-[9px] py-1.5 font-bold rounded cursor-pointer mt-1"
              >
                DISCHARGE INTERCEPT COLLIDE ENERGY BEAM
              </button>
            </div>

            {/* Quick deployment chips */}
            <div className="bg-[#10141e] border border-white/5 p-2 rounded">
              <span className="text-slate-500 text-[8px] block mb-1">APOLLO QUICK TARGETS:</span>
              <div className="grid grid-cols-2 gap-1 text-[8px]">
                {Object.keys(state.markets).slice(0, 4).map((tk) => (
                  <button 
                    key={tk}
                    onClick={() => { onSetTicker(tk); playSyntheticSound('tick'); }}
                    className={`p-1 border rounded font-mono font-bold uppercase cursor-pointer ${activeTicker === tk ? 'bg-[#00c2ff]/10 text-[#00c2ff] border-[#00c2ff]/40' : 'bg-[#06080c] border-[#1e2535] text-slate-400'}`}
                  >
                    SELECT_{tk}
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* COLUMN 3: Bloomberg Terminal Command Stream */}
        <div className="bg-[#040609] border border-[#00c2ff]/20 rounded-terminal flex flex-col overflow-hidden h-full">
          <div className="flex items-center justify-between bg-[#080d16] border-b border-[#00c2ff]/20 px-2.5 py-1 text-[9px] font-bold uppercase text-[#00c2ff]">
            <div className="flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-[#00c2ff]" />
              <span>TERMINAL COMMAND STREAM</span>
            </div>
            <span className="text-slate-500 font-normal">BBG BLOOMI v4.21</span>
          </div>

          {/* SQUAWK BOX - scrolling news flashpoints block */}
          <div className="bg-[#0b0f16] border-b border-[#1e2535] p-2 text-[9px] uppercase space-y-1 select-none">
            <span className="text-amber-500 font-bold tracking-tight block">// THE BLOOMI SQUAWK VOICE SENSOR:</span>
            <div className="h-[36px] overflow-hidden relative text-slate-300 font-mono text-[8.5px]/1.4 normal-case animate-pulse select-text">
              {state.currentTick % 25 < 8 ? (
                <p>⚠️ Global liquidities contract. <span className="text-[#00ff88] font-bold">OMEGA Singularity Core</span> executing stealth block trades in offshore debt derivatives.</p>
              ) : state.currentTick % 25 < 16 ? (
                <p>🔥 Geopolitical alerts: Baltic logistics conduits throttled. Crude contracts spike. Risk desks increase asset protection margins.</p>
              ) : (
                <p>📢 Central banks hint at massive liquidity expansions under the <span className="text-amber-500 font-bold">Basel IV agreement overrides</span>.</p>
              )}
            </div>
          </div>

          {/* Real-time Order Stream ticker / logs viewport */}
          <div className="flex-1 overflow-y-auto p-2 bg-[#06080c] text-[10px] space-y-1.5 scrollbar-thin select-text font-terminal">
            <div className="text-slate-500 text-[8px] border-b border-[#1e2535] pb-0.5">// REAL-TIME MULTI-SOURCE CRYPTO & BOND TELEMETRY LOGS</div>
            
            {/* Real-time ticker prices inside panel */}
            <div className="space-y-1 max-h-[80px] overflow-y-auto border-b border-[#1e2535]/50 pb-1.5 mb-1.5">
              {Object.values(state.markets).map((m: any) => {
                const isDown = m.currentPrice < (m.history[m.history.length - 2]?.close || m.currentPrice);
                return (
                  <div key={m.ticker} className="flex justify-between items-center text-[8.5px] font-mono select-none">
                    <span className="text-slate-400 font-bold">{m.ticker}: INDEX_TICK</span>
                    <span className={`font-semibold ${isDown ? 'text-[#ff3b5c]' : 'text-[#00ff88]'}`}>
                      ${m.currentPrice.toFixed(2)} {isDown ? '▼' : '▲'}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Custom Terminal log lines */}
            <div className="space-y-1">
              {state.chatLogs && state.chatLogs.length > 0 ? (
                state.chatLogs.map((log, idx) => (
                  <div key={idx} className="leading-relaxed border-b border-white/5 pb-1 text-[9.5px]">
                    <div className="flex justify-between text-[7px] text-slate-500 font-mono mb-0.5">
                      <span>{log.sender === 'user' ? 'DYNASTY_OPERATIVE' : 'BLOOMI_AI_ANALYST'}</span>
                      <span>{log.timestamp}</span>
                    </div>
                    <span className={log.sender === 'user' ? 'text-[#00c2ff]' : 'text-[#e2e8f0]'}>
                      {log.text}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-slate-500 italic text-center py-4 font-mono">// NO ACTIVE COMMUNICATIVE TRANSCRIPTS FOUND</div>
              )}
              <div ref={commandEndRef} />
            </div>
          </div>

          {/* HFT Logisticians logic-gate panel */}
          <div className="p-2 bg-[#080d16] border-t border-[#00c2ff]/20 uppercase space-y-1">
            <span className="text-slate-400 text-[8px] font-mono block mb-1">PROGRAM HFT ARBITRAGE GATES:</span>
            <div className="grid grid-cols-3 gap-1 text-[8px]">
              {[
                { id: 'cds_reaper', label: 'CDS_REAPER' },
                { id: 'scythe_arb', label: 'SCYTHE_ARB' },
                { id: 'frontrun_sig', label: 'SIGMA_POOL' }
              ].map(gate => {
                const active = hftGates.includes(gate.id);
                return (
                  <button
                    key={gate.id}
                    onClick={() => {
                      if (active) {
                        setHftGates(prev => prev.filter(g => g !== gate.id));
                      } else {
                        setHftGates(prev => [...prev, gate.id]);
                      }
                      playSyntheticSound('tick');
                    }}
                    className={`py-1 rounded border font-mono font-bold cursor-pointer text-center ${active ? 'bg-[#00ff88]/15 text-[#00ff88] border-[#00ff88]/50 animate-pulse' : 'bg-black border-[#1e2535] text-slate-400'}`}
                  >
                    {gate.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Functional command CLI input box */}
          <form onSubmit={handleCliSubmit} className="bg-black border-t border-[#00c2ff]/30 p-2 flex gap-1.5 font-mono shrink-0">
            <div className="flex items-center text-[#00c2ff] font-bold text-[11px] select-none">&gt;_</div>
            <input
              type="text"
              value={cliBuffer}
              onChange={(e) => setCliBuffer(e.target.value)}
              placeholder="BUY <ticker> <amount> | /short <ticker> <amount> | /firewall boost"
              className="flex-1 bg-transparent text-[#e8edf5] text-[10.5px] outline-none border-none caret-[#00c2ff] font-terminal font-medium focus:ring-0 placeholder:text-slate-700 uppercase"
            />
            <button
              type="submit"
              className="bg-[#00c2ff] text-black font-bold text-[9.5px] px-2 py-0.5 rounded cursor-pointer"
            >
              RUN_GO
            </button>
          </form>
        </div>

      </div>

    </div>
  );
};
