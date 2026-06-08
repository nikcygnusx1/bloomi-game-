/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { SimState, DynastyMember } from '../types';

interface DynastyTreeProps {
  state: SimState;
  onSomaticEdits: () => void;
  onHeirSpawn: (name: string, role: DynastyMember['role']) => void;
}

export const DynastyTree: React.FC<DynastyTreeProps> = ({ state, onSomaticEdits, onHeirSpawn }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dimensions, setDimensions] = useState({ width: 600, height: 280 });
  
  const [heirName, setHeirName] = useState('Alexander Sharma');
  const [heirRole, setHeirRole] = useState<DynastyMember['role']>('Heir');

  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const { width, height } = entries[0].contentRect;
      setDimensions({ width, height });
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = dimensions.width * dpr;
    canvas.height = dimensions.height * dpr;
    ctx.scale(dpr, dpr);

    const { width, height } = dimensions;

    // Paint core background
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = '#222222';
    ctx.lineWidth = 0.5;
    for (let i = 0; i < width; i += 40) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, height);
      ctx.stroke();
    }

    const members = state.dynasty?.members || [];
    if (members.length === 0) return;

    // Line drawing connectors
    ctx.strokeStyle = '#FFB000';
    ctx.lineWidth = 1.0;

    const nodeSpacing = width / (members.length + 1);
    const nodeY = height / 2;

    // Draw connecting lines first
    ctx.beginPath();
    members.forEach((m, idx) => {
      const nodeX = nodeSpacing * (idx + 1);
      if (idx === 0) {
        ctx.moveTo(nodeX, nodeY);
      } else {
        ctx.lineTo(nodeX, nodeY);
      }
    });
    ctx.stroke();

    // Render individual cells
    members.forEach((m, idx) => {
      const nodeX = nodeSpacing * (idx + 1);

      // Node card
      ctx.fillStyle = m.status === 'Alive' ? '#000000' : '#110000';
      ctx.strokeStyle = m.role === 'Head of Dynasty' ? '#FFB000' : '#FFB000/30';
      ctx.lineWidth = 1;
      
      const boxW = 145;
      const boxH = 52;
      ctx.fillRect(nodeX - boxW / 2, nodeY - boxH / 2, boxW, boxH);
      ctx.strokeRect(nodeX - boxW / 2, nodeY - boxH / 2, boxW, boxH);

      // Text inside
      ctx.fillStyle = m.status === 'Alive' ? '#FFFFFF' : '#FF0000';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(m.name.toUpperCase(), nodeX, nodeY - 10);

      ctx.fillStyle = '#FFB000';
      ctx.font = '8px monospace';
      ctx.fillText(`${m.role.toUpperCase()} (${m.age} YRS)`, nodeX, nodeY + 5);

      ctx.fillStyle = m.sociopathyIndex > 75 ? '#FF0000' : '#00FF00';
      ctx.fillText(`SOCIOPATHY INDEX: ${m.sociopathyIndex}%`, nodeX, nodeY + 16);
    });

    ctx.textAlign = 'left';
  }, [dimensions, state]);

  const activeHead = state.dynasty?.members.find(m => m.role === 'Head of Dynasty' && m.status === 'Alive');

  return (
    <div className="flex flex-col h-full overflow-hidden" ref={containerRef}>
      {/* Visual Canvas Block */}
      <div className="flex-1 relative overflow-hidden bg-black border border-[#FFB000]/30">
        <canvas ref={canvasRef} className="absolute inset-0 block w-full h-full" />
      </div>

      {/* Control Action Panel Decors */}
      <div className="bg-black border-t border-[#FFB000]/30 p-2 grid grid-cols-1 md:grid-cols-2 gap-2 select-none text-xs">
        
        {/* Recruitment Form */}
        <div className="flex flex-col gap-1 pr-2 border-r border-[#FFB000]/25">
          <h4 className="text-[#FFB000] font-bold uppercase text-[9px] tracking-tight">
            SPONSOR NEXT-GENERATION SUCCESSION
          </h4>
          <div className="flex flex-wrap gap-1.5 items-center">
            <input 
              type="text" 
              value={heirName} 
              onChange={e => setHeirName(e.target.value)}
              className="bg-black border border-[#FFB000]/30 px-1 py-0.5 outline-none text-white flex-1 min-w-[120px]"
              placeholder="Successor Call-name"
            />
            <select 
              value={heirRole} 
              onChange={e => setHeirRole(e.target.value as DynastyMember['role'])}
              className="bg-black border border-[#FFB000]/30 px-1 py-0.5 outline-none text-[#FFB000]"
            >
              <option value="Heir">MAIN HEIR</option>
              <option value="Operative">SHADOW OPERATIVE</option>
              <option value="Lobbyist_Chief">CHIEF LOBBYIST</option>
            </select>
          </div>
          <button
            onClick={() => onHeirSpawn(heirName, heirRole)}
            className="bg-black border border-[#FFB000]/30 hover:bg-[#FFB000]/10 text-[#FFB000] font-bold py-1 px-4 cursor-pointer text-center select-none text-[9px]"
          >
            SOW GENETIC SUCCESSION CORES
          </button>
        </div>

        {/* Somatic editing stats panel */}
        <div className="flex flex-col justify-between">
          <div>
            <h4 className="text-[#FFB000] font-bold uppercase text-[9px] tracking-tight mb-0.5">
              SOMATIC GENETIC THERAP CORE
            </h4>
            <div className="text-[10px] text-white/75">
              DEVISE HUMAN EMPATHY BYPASS PATHWAYS WITH <span className="text-[#00FF00] font-bold">$5.0 Trillion</span> SELECTION POOL. ENGAGING REDUCES CIVILIZATIONAL WEIGHT DEBUFFS.
            </div>
            {activeHead && (
              <div className="mt-1 text-[9px] flex flex-wrap gap-1 items-center bg-black/40">
                <span className="font-bold text-white/50">GENE MODS:</span>
                {activeHead.geneticEdits.map((e, index) => (
                  <span key={index} className="bg-black border border-[#FFB000]/25 text-[#FFB000] px-1 py-0.5">
                    {e}
                  </span>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={onSomaticEdits}
            disabled={state.player.cash < 5000000000000}
            className={`w-full font-bold py-1 justify-center uppercase text-center cursor-pointer select-none border mt-1.5 text-[9px] ${
              state.player.cash >= 5000000000000
                ? 'bg-[#FFB000] text-black border-[#FFB000]' 
                : 'bg-black text-white/20 border-white/10 cursor-not-allowed'
            }`}
          >
            {state.player.cash >= 5000000000000 
              ? 'DEPLOY SOMATIC IMMUNIZATION CODES' 
              : 'INSUFFICIENT STRATEGIC FUNDS (REQS $5.0T)'}
          </button>
        </div>
      </div>
    </div>
  );
};
