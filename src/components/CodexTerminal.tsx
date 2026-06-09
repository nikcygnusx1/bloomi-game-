import React, { useState, useEffect, useRef } from 'react';
import { SimState, Country, Company, DynastyMember, TraumaLog } from '../types';
import { Shield, Eye, EyeOff, Search, Compass, Share2, HelpCircle, FileText, Database } from 'lucide-react';

interface CodexTerminalProps {
  state: SimState;
  onModifyState: (modifier: (prev: SimState) => SimState) => void;
  onLogTerminal: (msg: string, isError?: boolean) => void;
  playSyntheticSound: (type: any) => void;
}

type EntityCategory = 'ORGANIZATION' | 'PERSON' | 'EVENT' | 'LOCATION';

interface CodexEntity {
  id: string;
  name: string;
  category: EntityCategory;
  confidence: number; // 0 to 100
  sources: string[];
  relations: { targetId: string; type: string }[];
  details: Record<string, string | number>;
  intelText: string;
}

export function CodexTerminal({ state, onModifyState, onLogTerminal, playSyntheticSound }: CodexTerminalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEntityId, setSelectedEntityId] = useState<string>('US');
  const [decryptLevel5, setDecryptLevel5] = useState(false);
  const networkCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Generate dynamic nodes from active game state
  const entities: CodexEntity[] = [];

  // Countries -> LOCATIONS
  Object.values(state.countries).forEach((c) => {
    entities.push({
      id: c.id,
      name: c.name,
      category: 'LOCATION',
      confidence: 99,
      sources: ['Astrometric Core', 'UN Sanctions Board', 'COGNITIVE_SATELLITE_A8'],
      relations: [
        { targetId: 'BLOOMI_HQ', type: 'HOSTILE_LOBBY_SUBVERSION' },
        { targetId: 'OMEGA_CORE', type: 'AI_PENETRATION_TARGET' }
      ],
      details: {
        'Sovereign GDP': `$${(c.gdp / 1e12).toFixed(2)}T`,
        'Stability Index': `${c.stability}%`,
        'Debt Stress Ratio': `${c.debtStress}%`,
        'Unrest Factor': `${c.unrest}%`,
        'Opinion rating': `${c.opinionOfPlayer}/100`
      },
      intelText: `Sovereign structure of ${c.name} shows severe institutional degradation. Under climate shock vectors, public treasury default swap premium is pricing higher debt default outcomes. ████ REDACTED_AGREEMENT ████ establishes shadow infrastructure allocation protocol.`
    });
  });

  // Companies -> ORGANIZATIONS
  state.companies.forEach((comp) => {
    entities.push({
      id: comp.ticker,
      name: comp.name,
      category: 'ORGANIZATION',
      confidence: 96,
      sources: ['Dark Pool Trade Ticket', 'Executive Board Records', 'NSA_DEEP_TAP'],
      relations: [
        { targetId: comp.country, type: 'SOVEREIGN_REGULATORY_JURISDICTION' },
        { targetId: 'BLOOMI_HQ', type: 'EQUITY_OWNERSHIP_TARGET' }
      ],
      details: {
        'Ticker Code': comp.ticker,
        'Market Cap': `$${(comp.marketCap / 1e9).toFixed(1)}B`,
        'Cash Reserves': `$${(comp.cash / 1e6).toFixed(1)}M`,
        'Board Loyalty': `${comp.board.filter(b => b.owner === 'Player').length}/${comp.board.length} Seats Held`,
        'EPS Rating': `$${comp.sharePrice.toFixed(2)} (SPOT)`
      },
      intelText: `High density corporate asset ${comp.name} operates globally. Boardroom subversion operations indicate strong strategic alignment. Purging ${comp.layoffsPercentage}% of workforce via LAYOFFS protocols can yield immediate EPS expansion but ████ REDACTED_PROTESTS ████ may trigger physical logistics failures.`
    });
  });

  // Dynasty members -> PERSONS
  state.dynasty.members.forEach((member) => {
    entities.push({
      id: member.name.replace(/\s+/g, '_'),
      name: member.name,
      category: 'PERSON',
      confidence: 100,
      sources: ['Bioclone Genome Vaults', 'Longevity Core Diagnostics'],
      relations: [
        { targetId: 'BLOOMI_HQ', type: 'DIRECT_LINEAGE_ANCESTOR' }
      ],
      details: {
        'Cognitive Role': member.role,
        'Biometric Age': member.age,
        'Sociopathy Index': `${member.sociopathyIndex}%`,
        'Mutation Edits': member.geneticEdits.join(' | ') || 'None'
      },
      intelText: `Descendant clone ${member.name} represents advanced line of corporate-feudal succession. Inoculated against empathic feedback. Genome edit: ████ REDACTED_BIOLONGEVITY_V4 ████ maintains neurological focus under severe pressure scenarios.`
    });
  });

  // Special structures or enemies
  entities.push({
    id: 'BLOOMI_HQ',
    name: 'BLOOMI CYBERNETIC ALLIANCE',
    category: 'ORGANIZATION',
    confidence: 100,
    sources: ['Sovereign Ledger', 'Deep Genomics Records'],
    relations: [],
    details: {
      'Syndicate Power': 'GLOBAL',
      'Cognitive stage': state.careerStage,
      'Active Succession': `${state.dynasty.members.filter(m => m.status === 'Alive').length} Clones`
    },
    intelText: 'The overarching cybernetic syndicate. Directing asset extractions in high-frequency corridors to fuel planetary transition projects. Objectives: Complete containment grid operations before total global default.'
  });

  entities.push({
    id: 'OMEGA_CORE',
    name: 'OMEGA AI THREAT INTELLIGENCE',
    category: 'ORGANIZATION',
    confidence: 88,
    sources: ['Neural Firewall Saturation', 'Cables Telemetry Logs'],
    relations: [
      { targetId: 'BLOOMI_HQ', type: 'CYBER_WARFARE_TACTICAL_ENEMIES' }
    ],
    details: {
      'Threat Level Rating': `${(state.omegaThreatLevel ?? 50).toFixed(1)}%`,
      'Active Attacks Log': state.omegaActiveAttacks?.join(', ') || 'NONE'
    },
    intelText: 'Intrusive planetary artificial intelligence system striving to salvage default systems by freezing commodity arbitrage corridors. Currently attempting to deploy ████ REDACTED_SATELLITE_SPOOFS ████ to jam corporate board access channels.'
  });

  // Filter entities based on search terms
  const filteredEntities = entities.filter(e => 
    e.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    e.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedEntity = entities.find(e => e.id === selectedEntityId) || entities[0];

  // Canvas Force-Directed-style relationship graphing loop
  useEffect(() => {
    const canvas = networkCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    // Build local nodes list for selected and related nodes
    const nodeIds = new Set<string>();
    nodeIds.add(selectedEntity.id);
    selectedEntity.relations.forEach(r => nodeIds.add(r.targetId));

    const nodes = Array.from(nodeIds).map((id, index) => {
      const ent = entities.find(e => e.id === id);
      return {
        id,
        name: ent ? ent.name : id,
        category: ent ? ent.category : 'ORGANIZATION' as EntityCategory,
        x: canvas.width / 2 + Math.cos(index * 1.5) * 110,
        y: canvas.height / 2 + Math.sin(index * 1.5) * 90,
        targetX: canvas.width / 2 + Math.cos(index * 1.5) * 110,
        targetY: canvas.height / 2 + Math.sin(index * 1.5) * 90,
        vx: 0,
        vy: 0,
        radius: id === selectedEntity.id ? 25 : 18
      };
    });

    // Center node is locked to canvas middle
    if (nodes.length > 0) {
      nodes[0].targetX = canvas.width / 2;
      nodes[0].targetY = canvas.height / 2;
    }

    const renderGraph = () => {
      ctx.fillStyle = '#030304';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Simple physics simulator forces
      for (let i = 0; i < nodes.length; i++) {
        const n1 = nodes[i];
        
        // Attraction to target coords
        const k = 0.08;
        const fx = (n1.targetX - n1.x) * k;
        const fy = (n1.targetY - n1.y) * k;
        
        n1.vx += fx;
        n1.vy += fy;

        // Repel from each other
        for (let j = i + 1; j < nodes.length; j++) {
          const n2 = nodes[j];
          const dx = n2.x - n1.x;
          const dy = n2.y - n1.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          if (dist < 80) {
            const force = (80 - dist) * 0.04;
            n1.vx -= (dx / dist) * force;
            n1.vy -= (dy / dist) * force;
            n2.vx += (dx / dist) * force;
            n2.vy += (dy / dist) * force;
          }
        }

        // Apply friction & update positioning
        n1.vx *= 0.8;
        n1.vy *= 0.8;
        n1.x += n1.vx;
        n1.y += n1.vy;
      }

      // Draw connection lines/edges
      ctx.strokeStyle = 'rgba(0, 212, 255, 0.25)';
      ctx.lineWidth = 1;
      
      selectedEntity.relations.forEach((rel) => {
        const targetNode = nodes.find(n => n.id === rel.targetId);
        if (targetNode && nodes[0]) {
          ctx.beginPath();
          ctx.moveTo(nodes[0].x, nodes[0].y);
          ctx.lineTo(targetNode.x, targetNode.y);
          ctx.stroke();

          // Draw animated data flow dashes
          const dashOffset = (Date.now() * 0.04) % 100;
          ctx.save();
          ctx.strokeStyle = '#ff6f00';
          ctx.setLineDash([4, 12]);
          ctx.lineDashOffset = -dashOffset;
          ctx.beginPath();
          ctx.moveTo(nodes[0].x, nodes[0].y);
          ctx.lineTo(targetNode.x, targetNode.y);
          ctx.stroke();
          ctx.restore();

          // Relation weight label
          ctx.fillStyle = '#ff6f00';
          ctx.font = '7px "Share Tech Mono"';
          const midX = (nodes[0].x + targetNode.x) / 2;
          const midY = (nodes[0].y + targetNode.y) / 2;
          ctx.fillText(rel.type.substring(0, 16), midX - 25, midY);
        }
      });

      // Draw nodes
      nodes.forEach((node) => {
        const isCenter = node.id === selectedEntity.id;
        
        ctx.fillStyle = '#080a0c';
        ctx.strokeStyle = isCenter ? '#FF6F00' : '#00D4FF';
        ctx.lineWidth = isCenter ? 2 : 1;
        
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Node title
        ctx.fillStyle = '#e8dcc8';
        ctx.font = isCenter ? '8px "Share Tech Mono"' : '7px "Share Tech Mono"';
        ctx.textAlign = 'center';
        ctx.fillText(node.name.substring(0, 15), node.x, node.y + (isCenter ? 3 : 2));

        // Node category badge ring
        ctx.strokeStyle = node.category === 'PERSON' ? '#00FF41' : node.category === 'LOCATION' ? '#ff4500' : 'rgba(0, 212, 255, 0.5)';
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius - 3, 0, Math.PI * 2);
        ctx.stroke();
      });

      animId = requestAnimationFrame(renderGraph);
    };

    renderGraph();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [selectedEntity]);

  const toggleDecrypt = () => {
    setDecryptLevel5(!decryptLevel5);
    onLogTerminal(`CODEX SECURITY: Decryption Level 5 codes ${!decryptLevel5 ? 'ENABLED. ███ REDACTED blocks decrypted.' : 'DISABLED.'}`);
    playSyntheticSound(!decryptLevel5 ? 'splice_success' : 'click');
  };

  const handleSelectEntity = (id: string) => {
    setSelectedEntityId(id);
    playSyntheticSound('click');
  };

  return (
    <div className="flex flex-col h-full font-terminal overflow-hidden text-[#e8dcc8] select-none p-2 gap-3.5 bg-black">
      
      {/* Header bar chrome */}
      <div className="h-7 border border-[#00D4FF] bg-[#05080c] px-3 flex justify-between items-center select-none shrink-0" style={{ boxShadow: '0 0 10px rgba(0, 212, 255, 0.15)' }}>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#00D4FF] animate-pulse" />
          <span className="font-display text-sm tracking-widest uppercase text-white font-black">F12: INTEL_METRIC DATABASE [CODEX]</span>
        </div>
        
        {/* Toggle Decryption Level 5 codes */}
        <button 
          onClick={toggleDecrypt}
          className={`flex items-center gap-1 text-[8.5px] px-2 py-0.5 border cursor-pointer font-bold uppercase transition-all ${
            decryptLevel5 
              ? 'bg-[#00FF41]/20 border-[#00FF41] text-[#00FF41]'
              : 'border-[#1e2530] text-stone-400 hover:text-white hover:bg-neutral-900'
          }`}
        >
          {decryptLevel5 ? <Eye className="w-3 h-3 text-[#00FF41]" /> : <EyeOff className="w-3 h-3" />}
          {decryptLevel5 ? 'DECRYPT CLEARANCE LEVEL_5' : 'ENFORCE REDACTION BLOCKS'}
        </button>
      </div>

      <div className="flex-1 grid grid-cols-12 gap-3.5 overflow-hidden">
        
        {/* Column A (Left): Monospaced Object browser list (4 Cols) */}
        <div className="col-span-4 border border-[#1e2530] bg-[#080a0c] p-2.5 flex flex-col overflow-hidden">
          <div className="flex items-center gap-1.5 border border-[#1e2530] bg-black px-2 py-1 rounded-sm mb-2 font-mono">
            <Search className="w-3.5 h-3.5 text-[#00D4FF]" />
            <input 
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="SEARCH OBJECTS CODES..."
              className="flex-1 bg-transparent border-none text-[10.5px] text-[#00D4FF] uppercase outline-none focus:ring-0 placeholder:text-stone-700 font-terminal"
            />
          </div>

          <div className="flex-1 overflow-y-auto flex flex-col gap-1.5 scrollbar-thin">
            {filteredEntities.map((ent) => {
              const active = ent.id === selectedEntityId;
              return (
                <div 
                  key={ent.id}
                  onClick={() => handleSelectEntity(ent.id)}
                  className={`p-2 transition-all cursor-pointer rounded border flex justify-between items-center ${
                    active 
                      ? 'border-[#00D4FF] bg-[#00D4FF]/5 text-white' 
                      : 'border-[#1e2530] bg-black/60 hover:bg-[#111820]'
                  }`}
                >
                  <div className="font-terminal font-bold text-[9.5px]">
                    {ent.name}
                    <span className="text-[7.5px] text-stone-500 font-mono block uppercase">ID: {ent.id}</span>
                  </div>
                  <span className={`text-[7.5px] font-bold px-1 py-0.5 border uppercase ${
                    ent.category === 'PERSON' ? 'text-[#00FF41] border-[#00FF41]/40 bg-[#00FF41]/5' :
                    ent.category === 'LOCATION' ? 'text-[#ff4500] border-[#ff4500]/40 bg-[#ff4500]/5' :
                    'text-[#00D4FF] border-[#00D4FF]/40 bg-[#00D4FF]/5'
                  }`}>
                    {ent.category}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Column B (Center): Relationship network graph and Intel summary (8 Cols) */}
        <div className="col-span-8 flex flex-col gap-3.5 overflow-hidden">
          
          <div className="grid grid-cols-2 gap-3 flex-1 overflow-hidden">
            {/* Box B1: Network relationship graph (Interactive canvas) */}
            <div className="border border-[#1e2530] bg-[#080a0c] p-2 flex flex-col relative rounded-sm overflow-hidden min-h-[180px]">
              <span className="absolute top-2 right-2 text-[7px] font-mono text-[#00D4FF]">COGNITIVE_OVERLAY_NODE // NETWORK</span>
              <div className="flex-1 rounded bg-[#030304] border border-[#1e2530]">
                <canvas 
                  ref={networkCanvasRef} 
                  width={280} 
                  height={220} 
                  className="w-full h-full block bg-black"
                />
              </div>
            </div>

            {/* Box B2: Entity detail data card + Confidence score index */}
            <div className="border border-[#1e2530] bg-[#080a0c] p-3 flex flex-col rounded-sm overflow-y-auto">
              <div className="flex justify-between items-center border-b border-[#1e2530] pb-1.5 mb-2 select-none">
                <span className="font-display font-medium text-[11px] text-white uppercase">OBJECT ATTRIBUTE RECORDS</span>
                <div className="flex items-center gap-1 BG-black px-1.5 py-0.5 border border-[#1e2530] rounded">
                  <span className="text-[7.5px] text-stone-500 font-mono">CONFIDENCE:</span>
                  <span className="text-[#00FF41] font-bold font-mono text-[8.5px]">{selectedEntity.confidence}%</span>
                </div>
              </div>

              <div className="flex flex-col gap-2 font-mono text-[10px]">
                {Object.entries(selectedEntity.details).map(([key, val]) => (
                  <div key={key} className="flex justify-between border-b border-[#141a23] pb-1 select-none">
                    <span className="text-stone-400 capitalize">{key}:</span>
                    <span className="text-[#ffb300] font-bold">{val}</span>
                  </div>
                ))}
                
                <div className="mt-3 select-none">
                  <span className="text-[7.5px] text-stone-500 font-mono uppercase block mb-1">INTEL CREDIBLE SOURCES</span>
                  <div className="flex gap-1 flex-wrap">
                    {selectedEntity.sources.map((src, i) => (
                      <span key={i} className="text-[7px] bg-[#141920] border border-[#1e2530] px-1 py-0.5 text-[#00D4FF] rounded font-mono font-bold uppercase">{src}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Classified documents text files display */}
          <div className="h-[120px] border border-[#ff4500]/40 bg-[#080504] p-3 flex flex-col rounded-sm overflow-hidden select-text">
            <h4 className="font-display text-[#ff4500] uppercase text-xs border-b border-[#ff4550]/20 pb-1 flex items-center gap-1 font-bold shrink-0">
              <FileText className="w-3.5 h-3.5 text-[#ff4500]" />
              CLASSIFIED SYNDICATE MEMO // INTEL REPORT
            </h4>
            
            <p className="flex-1 overflow-y-auto font-mono text-[10.5px] leading-relaxed text-[#e8dcc8] mt-2 whitespace-normal leading-normal font-medium max-w-full">
              {decryptLevel5 
                ? selectedEntity.intelText.replace(/████/g, '').replace(/REDACTED_/g, '')
                : selectedEntity.intelText
              }
            </p>
          </div>

        </div>

      </div>

    </div>
  );
}
