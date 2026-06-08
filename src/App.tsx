/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { createInitialWorld, saveSimState, loadSimState } from './sim/state';
import { GeopoliticalOmegaEngine } from './sim/engines';
import { SimState, DynastyMember } from './types';
import { TradingViewChart } from './components/TradingViewChart';
import { InfluenceWeb } from './components/InfluenceWeb';
import { DynastyTree } from './components/DynastyTree';
import { MacroPanel } from './components/MacroPanel';
import { CorporatePanel } from './components/CorporatePanel';
import { IntelligencePanel } from './components/IntelligencePanel';
import { CharacterCreator } from './components/CharacterCreator';
import { 
  Skull, 
  Activity, 
  Terminal as TermIcon, 
  TrendingUp, 
  Globe, 
  Pocket, 
  Network, 
  Radio, 
  ShieldAlert, 
  UserCheck, 
  Coins 
} from 'lucide-react';

export default function App() {
  const [gameState, setGameState] = useState<SimState | null>(null);
  const [activeTab, setActiveTab] = useState<'HELP' | 'TRADING' | 'CORPORATE' | 'MACRO' | 'INFLUENCE' | 'DYNASTY' | 'INTELLIGENCE'>('TRADING');
  const [selectedTicker, setSelectedTicker] = useState('APLH');
  
  // CLI State
  const [cliInput, setCliInput] = useState('');
  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    'SYSTEM SYSTEMA CORE CHANNELS ONLINE...',
    'TYPE "/help" IN TERMINAL PROMPT FOR ACCESS CODES.'
  ]);

  // Alert categories filtering
  const [feedFilter, setFeedFilter] = useState<'ALL' | 'CABLES' | 'TRAUMA'>('ALL');

  // Core Simulation Ticker Ticks loop runner
  const [isPaused, setIsPaused] = useState(true);
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1);
  const loopRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize from LocalStorage autosave or direct onboard creator
  useEffect(() => {
    const saved = loadSimState();
    if (saved) {
      setGameState(saved);
      setTerminalLogs(prev => [...prev, 'STATE RESTORATION: Loaded existing autosave state ledger.']);
    }
  }, []);

  // System ticking interval loop
  useEffect(() => {
    if (loopRef.current) clearInterval(loopRef.current);
    if (isPaused || !gameState) return;

    const intervalTime = 1000 / speedMultiplier;
    loopRef.current = setInterval(() => {
      setGameState((prev) => {
        if (!prev) return null;
        const nextState = GeopoliticalOmegaEngine.tick({ ...prev });
        // Auto-save state every 15 ticks of progress
        if (nextState.currentTick % 15 === 0) {
          saveSimState(nextState);
        }
        return nextState;
      });
    }, intervalTime);

    return () => {
      if (loopRef.current) clearInterval(loopRef.current);
    };
  }, [isPaused, speedMultiplier, gameState?.currentTick]);

  if (!gameState) {
    return (
      <CharacterCreator 
        onComplete={(params) => {
          const state = createInitialWorld(params);
          setGameState(state);
          setTerminalLogs(prev => [
            ...prev,
            `SYNDICATE ORIGIN SET: Host account created for ${params.name.toUpperCase()}.`,
            `INCEPTION FUNDS ALLOCATED: $${params.capital.toLocaleString()} generated as dynastic reserve.`
          ]);
        }}
      />
    );
  }

  // Helper bindings for simulation actions
  const handleBuyBonds = (countryId: string, amount: number) => {
    if (gameState.player.cash < amount) {
      logToTerminal('REJECTED: Insufficient liquidity capital assets.', true);
      return;
    }
    setGameState((prev) => {
      if (!prev) return null;
      const next = { ...prev };
      next.player.cash -= amount;
      next.player.assets.bonds[countryId] = (next.player.assets.bonds[countryId] || 0) + amount;
      
      // Calculate dynamic interest premium rate yields adjustments
      const country = next.countries[countryId];
      const ratio = country.bondsIssued / (country.gdp || 1);
      const yieldRate = country.interestRate + Math.max(0.001, (ratio - 0.5) * 0.05);

      logToTerminal(`SOVEREIGN LEVERAGE: Sponsoring $${amount.toLocaleString()} sovereign bonds on ${countryId} yields ${(yieldRate * 100).toFixed(2)}% APY.`);
      next.cables.push({
        time: `${next.date} 10:11:12`,
        source: 'Sovereign_Bonds',
        message: `PLAYER SPONSORED: Extracted sovereign depth in ${countryId}. Balance flow returned.`,
        classification: 'CONFIDENTIAL'
      });
      return next;
    });
  };

  const handleToggleMonetize = (countryId: string) => {
    setGameState((prev) => {
      if (!prev) return null;
      return GeopoliticalOmegaEngine.toggleCentralBankMonetize({ ...prev }, countryId);
    });
    const c = gameState.countries[countryId];
    logToTerminal(`PRINTING TOGGLE: Moneterization override toggled for ${countryId}.`);
  };

  const handleTakeover = (ticker: string) => {
    const corp = gameState.companies.find(c => c.ticker === ticker);
    if (!corp) return;
    const spot = gameState.markets[ticker]?.currentPrice || corp.sharePrice;
    const publicShares = corp.shareholders['retail_public'] || 0;
    const cost = publicShares * spot * 1.25;

    if (gameState.player.cash < cost) {
      logToTerminal('REJECTED: Insufficient cash to execute hostile private takeovers.', true);
      return;
    }

    setGameState((prev) => {
      if (!prev) return null;
      const next = { ...prev };
      const nextCorp = next.companies.find(c => c.ticker === ticker)!;
      next.player.cash -= cost;
      next.player.assets.stocks[ticker] = (next.player.assets.stocks[ticker] || 0) + publicShares;
      nextCorp.shareholders['player_dynasty'] = (nextCorp.shareholders['player_dynasty'] || 0) + publicShares;
      nextCorp.shareholders['retail_public'] = 0;
      
      logToTerminal(`HOSTILE TAKEOVER: ${corp.name} (${ticker}) purchased out. board controlled assigned entirely to Dynasty.`);
      return next;
    });
  };

  const handleLayoffs = (ticker: string) => {
    setGameState((prev) => {
      if (!prev) return null;
      const next = { ...prev };
      const corpIndex = next.companies.findIndex(c => c.ticker === ticker);
      if (corpIndex !== -1) {
        const corp = next.companies[corpIndex];
        corp.layoffsPercentage += 0.20; // Another 20% fired
        corp.expenses = corp.expenses * 0.90; // operational cash cost drops
        logToTerminal(`LAYOFF ACTION: Restructured corps margins at ${ticker}. 20% labor assets liquidated.`);
      }
      return next;
    });
  };

  const handleHireStaff = (role: 'analysts' | 'informants' | 'lobbyists', cost: number) => {
    if (gameState.player.cash < cost) {
      logToTerminal('REJECTED: Insufficient assets for human resource deployments.', true);
      return;
    }
    setGameState((prev) => {
      if (!prev) return null;
      const next = { ...prev };
      next.player.cash -= cost;
      next.player.assets[role] = (next.player.assets[role] || 0) + 1;
      logToTerminal(`DEPLOYMENT SUCCESS: Sponsored 1 ${role.toUpperCase()} operational matrix.`);
      return next;
    });
  };

  const handleNarrativeBomb = (countryId: string, ticker: string) => {
    if (gameState.player.cash < 10000000000) {
      logToTerminal('REJECTED: Narrative war operations require $10 Billion investment.', true);
      return;
    }
    setGameState((prev) => {
      if (!prev) return null;
      return GeopoliticalOmegaEngine.executeCognitiveStrike({ ...prev }, countryId, ticker);
    });
    logToTerminal(`DETONATION PROTOCOL: Deepfake narrative strike triggered on ${ticker} inside ${countryId}.`);
  };

  const handleSomaticEdits = () => {
    if (gameState.player.cash < 5000000000000) {
      logToTerminal('REJECTED: Eugenics Somatic Editing requires $5.0 Trillion.', true);
      return;
    }
    setGameState((prev) => {
      if (!prev) return null;
      return GeopoliticalOmegaEngine.investGeneticSomaticCore({ ...prev });
    });
    logToTerminal('EUGENICS SEQUENCING: Transgenic somatic edits launched on dynastic heirs.');
  };

  const handleHeirSpawn = (name: string, role: typeof gameState.dynasty.members[0]['role']) => {
    setGameState((prev) => {
      if (!prev) return null;
      const next = { ...prev };
      const cost = 25; // prestige cost
      if (next.dynasty.prestige < cost) {
        logToTerminal('REJECTED: Genetic lineages recruits requires 25 dynasty prestige points.', true);
        return next;
      }
      next.dynasty.prestige -= cost;
      next.dynasty.members.push({
        name,
        role,
        age: 18,
        status: 'Alive',
        sociopathyIndex: 60,
        geneticEdits: ['Somatic Base Matrix']
      });
      logToTerminal(`DYNASTY RECRUITMENT: ${name.toUpperCase()} seeded as family heirs.`);
      return next;
    });
  };

  const handleLimitOrder = (side: 'buy' | 'sell', price: number, qty: number) => {
    const totalCap = price * qty;
    if (side === 'buy' && gameState.player.cash < totalCap) {
      logToTerminal('REJECTED: Insufficient cash funds to match buy order constraints.', true);
      return;
    }
    if (side === 'sell' && (gameState.player.assets.stocks[selectedTicker] || 0) < qty) {
      logToTerminal(`REJECTED: Insufficient matching stock position in ${selectedTicker}.`, true);
      return;
    }

    setGameState((prev) => {
      if (!prev) return null;
      const next = { ...prev };
      const market = next.markets[selectedTicker];
      if (market) {
        market.orderBook[side === 'buy' ? 'bids' : 'asks'].push({
          id: Math.random().toString(),
          side,
          price,
          quantity: qty,
          owner: 'player_dynasty',
          timestamp: Date.now()
        });
        logToTerminal(`ORDER PLACED: Added ${side.toUpperCase()} limit on ${selectedTicker} at $${price.toFixed(2)} (Qty: ${qty})`);
      }
      return next;
    });
  };

  // Log outputs helper
  const logToTerminal = (text: string, isError: boolean = false) => {
    setTerminalLogs(prev => [...prev, `${isError ? 'ERROR // ' : 'SYS_OUT // '} ${text}`]);
  };

  // --- BLOOMBERG PROFESSIONAL UNIFIED COMMAND SYSTEM ---
  const executeUnifiedCommand = (rawString: string) => {
    const cmd = rawString.toUpperCase().trim();
    if (!cmd) return;

    logToTerminal(`BBG> ${rawString}`);

    // Help commands
    if (cmd === 'HELP' || cmd === 'HELP <GO>' || cmd === '/HELP' || cmd === 'F1' || cmd === 'F1 <GO>') {
      setActiveTab('HELP');
      logToTerminal('WORKSTATUS: LOADED F1 [HELP] USER COGNITIVE SYSTEMS DIRECTIVES.');
      return;
    }

    // Tab navigation keys
    if (cmd === 'F2' || cmd === 'F2 <GO>' || cmd === 'EQUITY' || cmd === 'EQUITY <GO>') {
      setActiveTab('TRADING');
      return;
    }
    if (cmd === 'F3' || cmd === 'F3 <GO>' || cmd === 'CORP' || cmd === 'CORP <GO>') {
      setActiveTab('CORPORATE');
      return;
    }
    if (cmd === 'F4' || cmd === 'F4 <GO>' || cmd === 'GOV' || cmd === 'GOV <GO>' || cmd === 'GOVT' || cmd === 'GOVT <GO>') {
      setActiveTab('MACRO');
      return;
    }
    if (cmd === 'F5' || cmd === 'F5 <GO>' || cmd === 'LOBBY' || cmd === 'LOBBY <GO>' || cmd === 'INFLUENCE' || cmd === 'INFLUENCE <GO>') {
      setActiveTab('INFLUENCE');
      return;
    }
    if (cmd === 'F6' || cmd === 'F6 <GO>' || cmd === 'FOUND' || cmd === 'FOUND <GO>' || cmd === 'DYNASTY' || cmd === 'DYNASTY <GO>') {
      setActiveTab('DYNASTY');
      return;
    }
    if (cmd === 'F7' || cmd === 'F7 <GO>' || cmd === 'INTEL' || cmd === 'INTEL <GO>') {
      setActiveTab('INTELLIGENCE');
      return;
    }

    // Normalize command string
    let clean = cmd.replace(/(<GO>|GO)$/, '').trim();
    clean = clean.replace(/\[/g, '').replace(/\]/g, '').trim();

    const stepStages = clean.split('|').map(s => s.trim());

    stepStages.forEach((stage) => {
      const parts = stage.split(/\s+/);
      if (parts.length === 0 || !parts[0]) return;

      const action = parts[0];

      // Dynamic ticker navigation
      if (gameState) {
        const tickerKeys = Object.keys(gameState.markets);
        if (tickerKeys.includes(action)) {
          setSelectedTicker(action);
          setActiveTab('TRADING');
          logToTerminal(`SECURITY CHOSEN: DIRECTED TO ${action} EQUITY CONTRACT.`);
          return;
        }

        // Dynamic country bonds navigation
        const countryKeys = Object.keys(gameState.countries);
        if (countryKeys.includes(action)) {
          setActiveTab('MACRO');
          logToTerminal(`SOVEREIGN CHOSEN: DIRECTED TO ${action} CREDIT MATRIX.`);
          return;
        }
      }

      // Unified action programs
      switch (action) {
        case 'BUY':
        case '/BUY': {
          if (parts.length < 4) return logToTerminal('REJECTED: BUY <ticker> <price> <qty> [GO]', true);
          const ticker = parts[1].toUpperCase();
          const p = parseFloat(parts[2]);
          const q = parseInt(parts[3]);
          setSelectedTicker(ticker);
          handleLimitOrder('buy', p, q);
          break;
        }

        case 'SELL':
        case '/SELL': {
          if (parts.length < 4) return logToTerminal('REJECTED: SELL <ticker> <price> <qty> [GO]', true);
          const ticker = parts[1].toUpperCase();
          const p = parseFloat(parts[2]);
          const q = parseInt(parts[3]);
          setSelectedTicker(ticker);
          handleLimitOrder('sell', p, q);
          break;
        }

        case 'DEBT':
        case '/DEBT': {
          if (parts.length < 3) return logToTerminal('REJECTED: DEBT <countryId> <amount> [GO]', true);
          const country = parts[1].toUpperCase();
          let rawAmt = parts[2].toLowerCase();
          let amount = parseFloat(rawAmt);
          if (rawAmt.endsWith('b')) amount *= 1000000000;
          if (rawAmt.endsWith('m')) amount *= 1000000;
          handleBuyBonds(country, amount);
          break;
        }

        case 'STRIKE':
        case '/STRIKE': {
          if (parts.length < 3) return logToTerminal('REJECTED: STRIKE <countryId> <ticker> [GO]', true);
          handleNarrativeBomb(parts[1].toUpperCase(), parts[2].toUpperCase());
          break;
        }

        case 'SOMATIC':
        case '/SOMATIC':
          handleSomaticEdits();
          break;

        case 'LAYOFFS':
        case '/LAYOFFS':
          if (parts.length < 2) return logToTerminal('REJECTED: LAYOFFS <ticker> [GO]', true);
          handleLayoffs(parts[1].toUpperCase());
          break;

        case 'TAKEOVER':
        case '/TAKEOVER':
          if (parts.length < 2) return logToTerminal('REJECTED: TAKEOVER <ticker> [GO]', true);
          handleTakeover(parts[1].toUpperCase());
          break;

        case 'OVERRIDES':
        case '/OVERRIDES':
          if (parts.length < 2) return logToTerminal('REJECTED: OVERRIDES <countryId> [GO]', true);
          handleToggleMonetize(parts[1].toUpperCase());
          break;

        case 'INTEL':
        case '/INTEL': {
          if (parts.length < 2) return logToTerminal('REJECTED: INTEL <analysts|informants|lobbyists> [GO]', true);
          const subType = parts[1].toUpperCase();
          if (subType === 'ANALYSTS' || subType === 'ANALYST') {
            handleHireStaff('analysts', 10000000);
          } else if (subType === 'INFORMANTS' || subType === 'INFORMANT') {
            handleHireStaff('informants', 50000000);
          } else if (subType === 'LOBBYISTS' || subType === 'LOBBYIST') {
            handleHireStaff('lobbyists', 200000000);
          } else {
            logToTerminal(`ERROR: Unknown intelligence division: ${parts[1]}`, true);
          }
          break;
        }

        default:
          logToTerminal(`ERROR: Unknown command: "${action}". Reference F1 [HELP] <GO> for command maps.`, true);
      }
    });
  };

  const handleCLISubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = cliInput.trim();
    setCliInput('');
    if (!cmd) return;
    executeUnifiedCommand(cmd);
  };

  // Glitch strength metrics computed from Global Stability
  const glitchStrength = 100 - gameState.globalStability;
  let layoutGlitchClass = '';
  if (glitchStrength > 60) {
    layoutGlitchClass = 'glitch-severe';
  } else if (glitchStrength > 35) {
    layoutGlitchClass = 'glitch-moderate';
  }

  // Live sidebar alerts compiling
  const combinedLogFeed = [];
  if (feedFilter === 'ALL' || feedFilter === 'CABLES') {
    gameState.cables.forEach(c => {
      combinedLogFeed.push({
        time: c.time,
        text: `[${c.source}] ${c.message}`,
        type: 'cable',
        classification: c.classification
      });
    });
  }
  if (feedFilter === 'ALL' || feedFilter === 'TRAUMA') {
    gameState.traumaLog.forEach(t => {
      combinedLogFeed.push({
        time: t.date,
        text: `[WORLD ESCALATION: ${t.eventType}] ${t.description} (Severity: ${t.severity}/10)`,
        type: 'trauma',
        classification: 'TOP_SECRET'
      });
    });
  }

  // Sort chronologically reverse showing latest first
  combinedLogFeed.sort((a, b) => b.time.localeCompare(a.time));

  return (
    <div className="h-screen w-screen bg-[#000000] text-[#FFFFFF] font-mono text-xs overflow-hidden flex flex-col relative select-none">
      
      {/* HEADER TAPE: Dynamic strict ticker matching Bloomberg design */}
      <header className="h-[36px] bg-[#000000] border-b border-[#FFB000]/30 flex items-center justify-between px-2 z-10 shrink-0 select-none">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 bg-[#FFB000]"></div>
          <span className="font-bold tracking-tight uppercase text-[11px] text-[#FFFFFF]">BLOOMBERG PROFESSIONAL SERVICE</span>
        </div>

        {/* Ticker marquee */}
        <div className="flex-1 mx-2 overflow-hidden relative h-[22px] flex items-center border border-[#FFB000]/20 bg-black px-2">
          <div className="animate-ticker flex gap-6">
            {Object.values(gameState.markets).map((m: any) => {
              const hist = m.history[m.history.length - 2];
              const isUp = hist ? m.currentPrice >= hist.close : true;
              return (
                <span 
                  key={m.ticker} 
                  className={`text-[10px] tracking-wider font-mono font-bold cursor-pointer hover:text-white transition-colors duration-150 ${isUp ? 'text-[#00FF00]' : 'text-[#FF0000]'}`}
                  onClick={() => {
                    executeUnifiedCommand(`${m.ticker} <GO>`);
                  }}
                >
                  {m.ticker}: ${m.currentPrice.toFixed(2)} {isUp ? '▲' : '▼'}
                </span>
              );
            })}
          </div>
        </div>

        {/* Calendar and counters */}
        <div className="flex items-center gap-2 text-[10px] text-white">
          <div>TICK: <span className="text-[#FFB000] font-bold">{gameState.currentTick}</span></div>
          <div className="text-white">DATE: <span className="text-[#FFB000]">{gameState.date}</span></div>
          <div className="flex items-center gap-1.5">
            <span className="text-[#FFB000]">SPD:</span>
            <button 
              onClick={() => setIsPaused(!isPaused)} 
              className={`px-1 py-0.5 border text-[9px] cursor-pointer font-bold ${isPaused ? 'border-[#00FF00] text-[#00FF00] bg-black' : 'border-white text-white'}`}
            >
              {isPaused ? 'HALT' : 'RUN'}
            </button>
            <button 
              onClick={() => setSpeedMultiplier(1)} 
              className={`px-1 py-0.5 border text-[9px] cursor-pointer ${speedMultiplier === 1 ? 'border-[#00FF00] text-[#00FF00] bg-black' : 'border-white text-white'}`}
            >
              1X
            </button>
            <button 
              onClick={() => setSpeedMultiplier(5)} 
              className={`px-1 py-0.5 border text-[9px] cursor-pointer ${speedMultiplier === 5 ? 'border-[#00FF00] text-[#00FF00] bg-black' : 'border-white text-white'}`}
            >
              5X
            </button>
            <button 
              onClick={() => setSpeedMultiplier(10)} 
              className={`px-1 py-0.5 border text-[9px] cursor-pointer ${speedMultiplier === 10 ? 'border-[#00FF00] text-[#00FF00] bg-black' : 'border-white text-white'}`}
            >
              10X
            </button>
          </div>
        </div>
      </header>

      {/* CORE WORKSPACE PANELS CONTAINER */}
      <div className="flex-1 flex overflow-hidden z-10 bg-black">
        
        {/* LEFT COLUMN: News Intelligence, logs feeds */}
        <div className="w-[30%] border-r border-[#FFB000]/20 bg-black flex flex-col overflow-hidden shrink-0 z-10">
          <div className="p-1 border-b border-[#FFB000]/25 bg-black flex justify-between items-center select-none">
            <span className="text-[10px] uppercase font-bold text-[#FFB000]">
              SYS CABLES LOG
            </span>
            <div className="flex gap-1">
              {['ALL', 'CABLES', 'TRAUMA'].map(btn => (
                <button
                  key={btn}
                  onClick={() => setFeedFilter(btn as any)}
                  className={`text-[8px] px-1 py-0.5 border cursor-pointer ${feedFilter === btn ? 'border-[#FFB000] text-[#FFB000]' : 'border-white/20 text-white/50'}`}
                >
                  {btn}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-1 flex flex-col gap-1 bg-black">
            {combinedLogFeed.map((feed, idx) => (
              <div 
                key={idx} 
                className={`p-1.5 border border-[#FFB000]/25 text-[10px] leading-tight bg-black ${
                  feed.type === 'trauma' ? 'border-[#FF0000] text-[#FF0000]' : 'border-[#FFB000]/25 text-[#FFFFFF]'
                }`}
              >
                <div className="flex justify-between items-center text-[8px] opacity-60 mb-0.5 font-mono">
                  <span>{feed.time}</span>
                  <span className={feed.type === 'trauma' ? 'text-[#FF0000] font-bold' : 'text-[#FFB000]'}>{feed.classification}</span>
                </div>
                <p className="font-mono">
                  {feed.text}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* CENTER COMPONENT: Active main visual tabs view */}
        <div className="flex-1 flex flex-col overflow-hidden z-20 border-r border-[#FFB000]/20 bg-black">
          
          {/* Bloomberg styled mechanical function key row */}
          <div className="h-[30px] bg-[#000000] border-b border-[#FFB000]/30 flex items-center px-1 select-none shrink-0 gap-1 overflow-x-auto">
            {[
              { id: 'HELP' as const, key: 'F1', label: 'HELP', bg: 'bg-[#FF0000] text-white' },
              { id: 'TRADING' as const, key: 'F2', label: 'EQTY', bg: 'bg-[#FFB000] text-black' },
              { id: 'CORPORATE' as const, key: 'F3', label: 'CORP', bg: 'bg-[#FFB000] text-black' },
              { id: 'MACRO' as const, key: 'F4', label: 'GOVT', bg: 'bg-[#FFB000] text-black' },
              { id: 'INFLUENCE' as const, key: 'F5', label: 'LOBBY', bg: 'bg-[#FFB000] text-black' },
              { id: 'DYNASTY' as const, key: 'F6', label: 'FOUND', bg: 'bg-[#FFB000] text-black' },
              { id: 'INTELLIGENCE' as const, key: 'F7', label: 'INTEL', bg: 'bg-[#FFB000] text-black' }
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    executeUnifiedCommand(`${tab.key} <GO>`);
                  }}
                  className={`h-[24px] px-2 flex items-center justify-center font-bold tracking-tight cursor-pointer transition-all border ${
                    isActive 
                      ? 'bg-white text-black border-white' 
                      : `${tab.bg} border-black hover:opacity-100`
                  }`}
                  style={{ minWidth: '70px' }}
                >
                  <span className="text-[10px] uppercase font-mono">
                    {tab.key} &lt;{tab.label}&gt;
                  </span>
                </button>
              );
            })}
          </div>

          {/* Tab contents visual container */}
          <div className="flex-1 overflow-hidden bg-black p-1">
            {activeTab === 'HELP' && (
              <div className="p-2 flex flex-col gap-2 overflow-y-auto h-full font-mono text-xs select-none bg-black text-[#FFB000]">
                <h2 className="text-[#FFB000] font-bold text-sm tracking-wider border-b border-[#FFB000]/40 pb-1">
                  BLOOMBERG PROFESSIONAL SERVICE // COMMAND INTERFACE & FUNCTION NAVIGATION
                </h2>
                <p className="text-[11px] text-[#FFFFFF] leading-relaxed">
                  SECURE PLATFORM ENGAGED. DYN-LEVEL MACROECONOMIC AND LIQUIDITY REVENUE DESK CONTROLS ARE ROUTED VIA UNIFIED COMMAND SYMBOLS. ENTER THE CODES BELOW IN THE PROMPT TO MONITOR AND EXECUTE.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-1">
                  <div className="border border-[#FFB000]/40 p-1 bg-black">
                    <h3 className="text-[#FFFFFF] font-bold text-[10px] mb-1 border-b border-[#FFB000]/20 pb-0.5">FUNCTION KEY BOARD SHORTCUTS</h3>
                    <div className="space-y-0.5 font-mono text-[9px]">
                      <div><span className="text-[#FFFFFF] font-bold">F1 &lt;GO&gt;</span> - ACC REQUISITIONS GUIDE & DIRECTIVES</div>
                      <div><span className="text-[#FFFFFF] font-bold">F2 &lt;GO&gt;</span> - OPEN INTERACTION SYMBOLS MARKET DESK</div>
                      <div><span className="text-[#FFFFFF] font-bold">F3 &lt;GO&gt;</span> - CORPORATE ACQUISITIONS AND RE-STRUCTURE CONSOLE</div>
                      <div><span className="text-[#FFFFFF] font-bold">F4 &lt;GO&gt;</span> - SOVEREIGN LIQUIDITY CREDIT REGISTRY</div>
                      <div><span className="text-[#FFFFFF] font-bold">F5 &lt;GO&gt;</span> - ACTIVE LOBBY STRATEGIES MAP & CHANNELS</div>
                      <div><span className="text-[#FFFFFF] font-bold">F6 &lt;GO&gt;</span> - DYNASTY SOMATIC HEIRS GENEALOGY</div>
                      <div><span className="text-[#FFFFFF] font-bold">F7 &lt;GO&gt;</span> - INTEL STRIKES AND STAFF DISPATCH MATRIX</div>
                    </div>
                  </div>

                  <div className="border border-[#FFB000]/40 p-1 bg-black">
                    <h3 className="text-[#FFFFFF] font-bold text-[10px] mb-1 border-b border-[#FFB000]/20 pb-0.5">DIRECT TRANSACTION DIALECTICS (CLI RUNNERS)</h3>
                    <div className="space-y-0.5 font-mono text-[9px]">
                      <div><span className="text-[#00FF00] font-bold">BUY &lt;SYM&gt; &lt;PRC&gt; &lt;QTY&gt; &lt;GO&gt;</span> - LIMIT BUY</div>
                      <div><span className="text-[#FF0000] font-bold">SELL &lt;SYM&gt; &lt;PRC&gt; &lt;QTY&gt; &lt;GO&gt;</span> - LIMIT SELL</div>
                      <div><span className="text-[#FFFFFF] font-bold">DEBT &lt;NAT&gt; &lt;VAL&gt; &lt;GO&gt;</span> - PURCHASE SOVEREIGN DEBT BONDS</div>
                      <div><span className="text-[#FFFFFF] font-bold">OVERRIDES &lt;NAT&gt; &lt;GO&gt;</span> - COMMENCE PRINTING POWER PRESS</div>
                      <div><span className="text-[#FFFFFF] font-bold">STRIKE &lt;NAT&gt; &lt;SYM&gt; &lt;GO&gt;</span> - ACCELERATE NARRATIVE BOMBER</div>
                      <div><span className="text-[#FFFFFF] font-bold">LAYOFFS &lt;SYM&gt; &lt;GO&gt;</span> - DEPRIVE 20% OF WORK FORCE FROM PAY</div>
                      <div><span className="text-[#FFFFFF] font-bold">TAKEOVER &lt;SYM&gt; &lt;GO&gt;</span> - ENGAGE COMPELLED CORPORATE ACQUISITION</div>
                      <div><span className="text-[#FFFFFF] font-bold">SOMATIC &lt;GO&gt;</span> - EXECUTE HEIR CHROMOSOMAL UPGRADINGS</div>
                    </div>
                  </div>
                </div>

                <div className="border border-[#FFB000]/20 p-1 mt-1 bg-black">
                  <h4 className="text-[#FFFFFF] font-bold text-[9px] mb-0.5">NOTICE</h4>
                  <p className="text-[9px] text-[#FFFFFF]/70">
                    INTERACTIVE LABELS IN SECTOR PANELS DISPATCH TO THE BBG_CONSOLE CONVENIENTLY UPON MOUSE ACTIONS.
                  </p>
                </div>
              </div>
            )}
            {activeTab === 'TRADING' && (
              <div className="h-full flex overflow-hidden bg-black">
                <div className="w-[180px] border-r border-[#FFB000]/20 bg-black flex flex-col overflow-y-auto shrink-0 select-none">
                  <div className="p-1 border-b border-[#FFB000]/20 text-[9px] font-bold text-center text-[#FFB000] bg-[#FFB000]/10">EQUITY TICKER SYMBOLS</div>
                  {Object.keys(gameState.markets).map(sym => (
                    <button
                      key={sym}
                      onClick={() => executeUnifiedCommand(`${sym} <GO>`)}
                      className={`text-left p-1 text-[11px] border-b border-[#FFB000]/10 cursor-pointer flex justify-between items-center transition-all ${selectedTicker === sym ? 'bg-[#FFB000]/20 text-[#FFB000] font-bold' : 'text-[#FFFFFF] hover:bg-[#FFB000]/10'}`}
                    >
                      <span>{sym}</span>
                      <span className="text-[10px] font-mono text-[#00FF00]">${gameState.markets[sym]?.currentPrice.toFixed(2)}</span>
                    </button>
                  ))}
                </div>
                <div className="flex-1 h-full bg-black">
                  {gameState && (
                    <TradingViewChart 
                      state={gameState} 
                      activeTicker={selectedTicker} 
                      onPlaceOrder={(side, price, qty) => {
                        executeUnifiedCommand(`${side.toUpperCase()} ${selectedTicker} ${price.toFixed(2)} ${qty} <GO>`);
                      }}
                    />
                  )}
                </div>
              </div>
            )}
            {activeTab === 'INFLUENCE' && (
              <InfluenceWeb 
                state={gameState} 
                onDonate={(id, amt) => {
                  setGameState((prev) => {
                    if (!prev) return null;
                    const next = { ...prev };
                    if (next.player.cash < amt) {
                      logToTerminal('REJECTED: Insufficient cash funds to purchase shadow influence nodes.', true);
                      return next;
                    }
                    next.player.cash -= amt;
                    const targetNode = next.influenceNodes.find(n => n.id === id);
                    if (targetNode) {
                      targetNode.playerControlWeight = Math.min(100, targetNode.playerControlWeight + 15);
                      logToTerminal(`LOBBY CONTRACT: Contributed $${amt.toLocaleString()} to global lobby target ${targetNode.name}. Captured weights spiked to ${targetNode.playerControlWeight.toFixed(1)}%.`);
                    }
                    return next;
                  });
                }}
                onTogglePrinting={handleToggleMonetize}
              />
            )}
            {activeTab === 'DYNASTY' && (
              <DynastyTree 
                state={gameState} 
                onSomaticEdits={handleSomaticEdits}
                onHeirSpawn={handleHeirSpawn}
              />
            )}
            {activeTab === 'MACRO' && (
              <MacroPanel 
                state={gameState} 
                onBuyBonds={handleBuyBonds}
                onTogglePrinting={handleToggleMonetize}
              />
            )}
            {activeTab === 'CORPORATE' && (
              <CorporatePanel 
                state={gameState} 
                onTakeover={handleTakeover}
                onLayoffs={handleLayoffs}
              />
            )}
            {activeTab === 'INTELLIGENCE' && (
              <IntelligencePanel 
                state={gameState} 
                onHireStaff={handleHireStaff}
                onNarrativeBomb={handleNarrativeBomb}
              />
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Player Balance status + Geopolitics metrics */}
        <div className="w-[320px] bg-black flex flex-col overflow-y-auto shrink-0 select-none p-1 gap-2.5 z-10 border-l border-[#FFB000]/20">
          
          {/* Section: Wealth Ledger */}
          <div className="border border-[#FFB000]/30 bg-black p-1.5 flex flex-col gap-1 rounded-none">
            <h3 className="text-[#FFB000] font-mono font-bold uppercase text-[9px] tracking-tight flex items-center gap-1">
              <Pocket className="w-3 h-3 text-[#FFB000]" />
              DYNASTY BALANCE SHEET & REQUISITIONS
            </h3>
            <div className="flex flex-col gap-0.5">
              <span className="text-[8px] text-white/50 uppercase tracking-wider">LIQUID ACCOUNTING BAL</span>
              <span className="text-lg font-mono font-bold text-[#00FF00] tracking-tight">
                ${gameState.player.cash.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-1 text-[9px] border-t border-[#FFB000]/20 pt-1 font-mono">
              <div>
                <span className="text-white/50 block text-[8px] uppercase">PRESTIGE INDEX:</span>
                <span className="text-[#00FF00] font-bold text-xs">{gameState.dynasty.prestige.toFixed(1)} PTS</span>
              </div>
              <div>
                <span className="text-white/50 block text-[8px] uppercase">DYNASTIC HEIRS:</span>
                <span className="text-white font-bold text-xs uppercase">GEN {gameState.dynasty.generation}</span>
              </div>
            </div>
          </div>

          {/* Section: Sovereign reserves metrics */}
          <div className="border border-[#FFB000]/20 bg-black p-1.5 flex flex-col gap-1 rounded-none">
            <h3 className="text-[#FFB000] font-mono font-bold uppercase text-[9px] tracking-tight flex items-center gap-1">
              <Globe className="w-3 h-3 text-[#FFB000]" />
              SOVEREIGN BOND REGISTRY
            </h3>
            
            <div className="flex flex-col gap-1 font-mono text-[9px]">
              {Object.values(gameState.countries).map((c: any) => (
                <div key={c.id} className="bg-black p-1 border border-[#FFB000]/15 flex justify-between items-center gap-1.5">
                  <div>
                    <span className="font-bold text-white text-[10px]">{c.name.substring(0, 15)}</span>
                    <span className="text-[8px] text-[#FFB000] block uppercase mt-0.5">UNEMPL: {(c.unemployment * 100).toFixed(1)}%</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[#00FF00] font-bold block">${(c.gdp / 1e12).toFixed(2)}T GDP</span>
                    <span className="text-[#FF0000] block text-[8px] uppercase mt-0.5">UNREST: {c.unrest.toFixed(0)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section: Cybernetic systems indicators */}
          <div className="border border-[#FFB000]/20 bg-black p-1.5 flex flex-col gap-1 rounded-none text-[9px]">
            <h3 className="text-[#FFB000] font-mono font-bold uppercase text-[9px] tracking-tight flex items-center gap-1">
              <Activity className="w-3 h-3 text-[#FFB000]" />
              SYSTEMIC RISK & LIQUIDITY
            </h3>
            
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center">
                <span className="text-white/50 uppercase text-[8px] tracking-wider">GLOBAL STABILITY:</span>
                <span className={`font-bold ${gameState.globalStability > 60 ? 'text-[#00FF00]' : 'text-[#FF0000] animate-pulse'}`}>{gameState.globalStability}%</span>
              </div>
              <div className="h-1 bg-black border border-[#FFB000]/20 rounded-none overflow-hidden">
                <div 
                  className={`h-full ${gameState.globalStability > 60 ? 'bg-[#00FF00]' : 'bg-[#FF0000]'}`} 
                  style={{ width: `${gameState.globalStability}%` }}
                />
              </div>

              <div className="flex justify-between items-center mt-0.5">
                <span className="text-white/50 uppercase text-[8px] tracking-wider">WORLD TRAUMA DEBUFF:</span>
                <span className="text-[#FF0000] font-bold">{gameState.globalSuffering}%</span>
              </div>
              <div className="h-1 bg-black border border-[#FFB000]/20 rounded-none overflow-hidden">
                <div className="h-full bg-[#FF0000]" style={{ width: `${gameState.globalSuffering}%` }} />
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* BOTTOM CLI PROMPT SHELL INPUT */}
      <footer className="h-[140px] bg-black border-t border-[#FFB000]/30 flex flex-col shrink-0 font-mono z-10">
        
        {/* Terminal log history */}
        <div className="flex-1 overflow-y-auto p-1.5 text-[10px] text-white flex flex-col gap-0.5 select-text scrollbar-thin bg-black">
          {terminalLogs.map((log, index) => {
            const isErr = log.startsWith('ERROR') || log.startsWith('REJECTED');
            const isCmd = log.includes('OMEGA>');
            return (
              <div 
                key={index} 
                className={`${isErr ? 'text-[#FF0000] font-bold' : isCmd ? 'text-[#FFB000] font-bold' : 'text-white/70'}`}
              >
                {isCmd ? <span className="text-[#FFB000] mr-1">&gt;</span> : <span className="text-white/20 mr-1">//</span>}
                {log}
              </div>
            );
          })}
        </div>

        {/* Input prompt bar */}
        <form 
          onSubmit={handleCLISubmit}
          className="h-[28px] bg-black border-t border-[#FFB000]/30 flex items-center px-2 gap-1.5"
        >
          <TermIcon className="w-3 h-3 text-[#FFB000]" />
          <span className="text-[#FFB000] font-bold text-[10px] tracking-tight shrink-0">BBG_CONSOLE_&gt;</span>
          <input 
            type="text" 
            value={cliInput}
            onChange={e => setCliInput(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none text-white text-[11px] caret-[#FFB000] font-mono focus:ring-0 placeholder:text-white/20"
            placeholder="Type 'HELP <GO>' or use physical function keys above to navigate tabs."
            autoComplete="off"
          />
        </form>
      </footer>

      {/* IMMERSIVE BAR FOOTER FOR ACTIVE SYSTEMS */}
      <footer className="h-5 bg-[#FFB000] text-black text-[9px] flex items-center px-2 justify-between uppercase font-bold tracking-tight shrink-0 z-50">
        <span>RUN: 10,000 ACTIVE SEC</span>
        <span>CLOCK: {gameState.date}-T09:42:00Z</span>
        <span>ENCRYPT: BBG_DES_V3_SECURE</span>
        <span>SYS: ONLINE</span>
      </footer>

    </div>
  );
}
