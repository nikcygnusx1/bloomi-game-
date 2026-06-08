/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { SimState, InfluenceNode } from '../types';

interface InfluenceWebProps {
  state: SimState;
  onDonate: (nodeId: string, amount: number) => void;
  onTogglePrinting: (countryId: string) => void;
}

export const InfluenceWeb: React.FC<InfluenceWebProps> = ({ state, onDonate, onTogglePrinting }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dimensions, setDimensions] = useState({ width: 600, height: 400 });

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

    // Paint core matrix grid
    ctx.fillStyle = '#06070a';
    ctx.fillRect(0, 0, width, height);

    // Draw background telemetry lines
    ctx.strokeStyle = '#18181b';
    ctx.lineWidth = 0.5;
    const spacing = 40;
    for (let x = 0; x < width; x += spacing) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += spacing) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Fixed coordinates for core hubs to make maps resilient against layout drifts
    const center = { x: width / 2, y: height / 2 };
    
    interface HubNode {
      id: string;
      label: string;
      type: string;
      x: number;
      y: number;
      color: string;
      control: number;
    }

    const mapNodeCoords: Record<string, { x: number; y: number; color: string }> = {
      'wash_lobby': { x: width * 0.22, y: height * 0.28, color: '#00ccff' },
      'cia_analog': { x: width * 0.78, y: height * 0.28, color: '#f59e0b' },
      'beijing_com': { x: width * 0.22, y: height * 0.72, color: '#ef4444' },
      'brussels_reg': { x: width * 0.78, y: height * 0.72, color: '#10b981' }
    };

    // Render flow lines with energetic gradients pulsing down the lines (Liquidity flows animation)
    const timeFactor = (Date.now() / 1000) % 360;
    
    state.influenceNodes.forEach((node) => {
      const coord = mapNodeCoords[node.id];
      if (coord) {
        const flowGrad = ctx.createLinearGradient(center.x, center.y, coord.x, coord.y);
        
        // Animated gradient stops matching the weight of the capture
        // Pulse speed accelerates on high capture
        const speedMultiplier = (node.playerControlWeight / 100) * 0.5 + 0.1;
        const pulseOffset = (Date.now() * 0.005 * speedMultiplier) % 1.0;

        flowGrad.addColorStop(0, '#18181b');
        flowGrad.addColorStop(Math.min(0.99, Math.max(0.01, (pulseOffset + 0.0) % 1.0)), 'rgba(255,176,0,0.1)');
        flowGrad.addColorStop(Math.min(0.99, Math.max(0.01, (pulseOffset + 0.1) % 1.0)), '#ffb000');
        flowGrad.addColorStop(Math.min(0.99, Math.max(0.01, (pulseOffset + 0.2) % 1.0)), 'rgba(255,176,0,0.1)');
        flowGrad.addColorStop(1, coord.color);

        ctx.strokeStyle = flowGrad;
        ctx.lineWidth = Math.max(1, node.playerControlWeight * 0.07);
        ctx.beginPath();
        ctx.moveTo(center.x, center.y);
        ctx.lineTo(coord.x, coord.y);
        ctx.stroke();

        // Print capture percent tags on midpoint of links
        const midX = (center.x + coord.x) / 2;
        const midY = (center.y + coord.y) / 2;
        ctx.fillStyle = '#71717a';
        ctx.font = '9px monospace';
        ctx.fillText(`CAPTURE: ${node.playerControlWeight.toFixed(1)}%`, midX - 25, midY + 12);
      }
    });

    // Draw secondary conduits between lobby hubs to generate the complex network feel
    ctx.strokeStyle = 'rgba(255,255,255,0.025)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(width * 0.22, height * 0.28);
    ctx.lineTo(width * 0.78, height * 0.28);
    ctx.lineTo(width * 0.78, height * 0.72);
    ctx.lineTo(width * 0.22, height * 0.72);
    ctx.lineTo(width * 0.22, height * 0.28);
    ctx.stroke();

    // Render Hub Node circles with glowing ring states
    state.influenceNodes.forEach((node) => {
      const coord = mapNodeCoords[node.id];
      if (coord) {
        const glowRadius = 14 + (Math.sin(Date.now() * 0.003) * 2);

        // Outside Glow
        const radG = ctx.createRadialGradient(coord.x, coord.y, 4, coord.x, coord.y, glowRadius);
        radG.addColorStop(0, coord.color);
        radG.addColorStop(0.3, coord.color + '33'); // Faded glow
        radG.addColorStop(1, 'transparent');

        ctx.fillStyle = radG;
        ctx.beginPath();
        ctx.arc(coord.x, coord.y, glowRadius, 0, Math.PI * 2);
        ctx.fill();

        // Core dot
        ctx.fillStyle = coord.color;
        ctx.beginPath();
        ctx.arc(coord.x, coord.y, 8, 0, Math.PI * 2);
        ctx.fill();

        // Border loop ring
        ctx.strokeStyle = '#27272a';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(coord.x, coord.y, 14, 0, Math.PI * 2);
        ctx.stroke();

        // Label tags
        ctx.fillStyle = '#fafafa';
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(node.name.toUpperCase(), coord.x, coord.y - 18);

        ctx.fillStyle = '#52525b';
        ctx.font = '8px monospace';
        ctx.fillText(`${node.type} // CORPS UNIT`, coord.x, coord.y + 24);
      }
    });

    // Render central player dynasty core hub
    const centerGlow = 18 + (Math.sin(Date.now() * 0.004) * 3);
    const centerG = ctx.createRadialGradient(center.x, center.y, 4, center.x, center.y, centerGlow);
    centerG.addColorStop(0, '#ffb000');
    centerG.addColorStop(0.3, 'rgba(255,176,0,0.15)');
    centerG.addColorStop(1, 'transparent');

    ctx.fillStyle = centerG;
    ctx.beginPath();
    ctx.arc(center.x, center.y, centerGlow, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffb000';
    ctx.beginPath();
    ctx.arc(center.x, center.y, 10, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(center.x, center.y, 4, 0, Math.PI * 2);
    ctx.fill();

    // Player node label tags
    ctx.fillStyle = '#ffb000';
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(state.player.name.toUpperCase(), center.x, center.y - 24);

    ctx.fillStyle = '#a1a1aa';
    ctx.font = '8px monospace';
    ctx.fillText('DYNASTIC DESCENT ROOT NODE', center.x, center.y + 30);

    ctx.textAlign = 'left';
  }, [dimensions, state]);

  return (
    <div className="flex flex-col h-full overflow-hidden" ref={containerRef}>
      {/* Visual Canvas space */}
      <div className="flex-1 relative overflow-hidden bg-black border border-[#FFB000]/30">
        <canvas ref={canvasRef} className="absolute inset-0 block w-full h-full" />
      </div>

      {/* Interact Controls */}
      <div className="bg-black border-t border-[#FFB000]/30 p-2 select-none">
        <h4 className="text-[#FFB000] font-bold uppercase text-[10px] tracking-tight mb-1.5">
          REGULATORY CAPTURE MATRIX CONTOURS
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
          {state.influenceNodes.map((node) => {
            const country = state.countries[node.nation];
            return (
              <div key={node.id} className="bg-black border border-[#FFB000]/25 p-1.5 flex flex-col justify-between gap-1 text-[11px]">
                <div>
                  <div className="text-white font-bold">{node.name}</div>
                  <div className="text-[10px] text-white/50 mt-0.5">NATION: {node.nation} // CAPTURE: {node.playerControlWeight.toFixed(1)}%</div>
                </div>
                <div className="flex flex-col gap-1 mt-1">
                  <button
                    onClick={() => onDonate(node.id, 50000000)}
                    className="w-full bg-black hover:bg-[#FFB000]/10 text-[#FFB000] border border-[#FFB000]/30 hover:border-[#FFB000] text-[10px] font-bold py-0.5 px-2 select-none cursor-pointer text-center"
                  >
                    DONATE $50M
                  </button>
                  {node.playerControlWeight >= 80 && country && (
                    <button
                      onClick={() => onTogglePrinting(node.nation)}
                      className={`w-full text-black text-[9px] font-bold py-0.5 px-2 select-none cursor-pointer text-center ${
                        country.centralBank.printingPressOverride 
                          ? 'bg-[#FF0000] text-white' 
                          : 'bg-[#00FF00]'
                      }`}
                    >
                      {country.centralBank.printingPressOverride ? 'HALT MONETIZATION' : 'OVERSIZE PRINTING'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
