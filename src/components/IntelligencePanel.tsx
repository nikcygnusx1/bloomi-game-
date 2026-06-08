/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import React, { useState } from 'react';
import { SimState } from '../types';

interface IntelligencePanelProps {
  state: SimState;
  onHireStaff: (role: 'analysts' | 'informants' | 'lobbyists', cost: number) => void;
  onNarrativeBomb: (countryId: string, ticker: string) => void;
}

export const IntelligencePanel: React.FC<IntelligencePanelProps> = ({ state, onHireStaff, onNarrativeBomb }) => {
  const [targetCountry, setTargetCountry] = useState('US');
  const [targetTicker, setTargetTicker] = useState('APLH');

  const handleDetonate = () => {
    onNarrativeBomb(targetCountry, targetTicker);
  };

  return (
    <div className="p-2 flex flex-col gap-2 overflow-y-auto h-full font-mono text-xs select-none bg-black text-[#FFB000]">
      <div className="flex flex-col gap-0.5 border-b border-[#FFB000]/30 pb-1.5">
        <h2 className="text-[#FFB000] font-bold uppercase text-xs tracking-tight">
          COGNITIVE OPERATIVE & INTELLIGENCE DIVISION
        </h2>
        <p className="text-white/60 text-[10px]">
          DEPLOY ESPIONAGE NODES TO GATHER POLICY BREACH SECRETS. WEAPONIZE NARRATIVE PAYLOADS TO FORCE 40% CONTRAPTIONAL SELL-OFFS ON TARGET MARKETS.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        
        {/* Espionage Agency recruitment */}
        <div className="bg-black border border-[#FFB000]/30 p-2 flex flex-col gap-2">
          <h3 className="text-white font-bold uppercase tracking-tight text-xs border-b border-[#FFB000]/15 pb-1">
            ESPIONAGE ASSET ACQUISITION
          </h3>

          <div className="flex flex-col gap-1.5">
            {[
              { id: 'analysts' as const, title: 'QUANT FINANCIAL ANALYST UNIT', cost: 250000, desc: 'Yields advanced trading alerts of central bank interest adjustments.', count: state.player.assets.analysts || 0 },
              { id: 'informants' as const, title: 'CORPORATE INFORMANT DESK', cost: 500000, desc: 'Intercepts incoming earnings misses / corporate restructuring briefs.', count: state.player.assets.informants || 0 },
              { id: 'lobbyists' as const, title: 'CHIEF LOBBYIST INTER-EMBASSY', cost: 1000000, desc: 'Durable lobbying node assigned to Washington or Brussels legislations.', count: state.player.assets.lobbyists || 0 }
            ].map((staff) => (
              <div key={staff.id} className="bg-black border border-[#FFB000]/15 p-1.5 flex flex-col gap-1">
                <div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-white">{staff.title}</span>
                    <span className="text-[#00FF00] font-bold">${staff.cost.toLocaleString()}</span>
                  </div>
                  <p className="text-[10px] text-white/50">{staff.desc}</p>
                </div>
                <div className="flex justify-between items-center mt-1 pt-1 border-t border-[#FFB000]/15">
                  <span className="text-[9px] text-white/70">UNITS: <span className="text-[#FFB000] font-bold">{staff.count}</span></span>
                  <button
                    onClick={() => onHireStaff(staff.id, staff.cost)}
                    disabled={state.player.cash < staff.cost}
                    className={`font-mono text-[9px] font-bold py-0.5 px-2 cursor-pointer ${
                      state.player.cash >= staff.cost
                        ? 'bg-[#FFB000] text-black hover:opacity-90'
                        : 'bg-black text-white/20 border border-white/10 cursor-not-allowed'
                    }`}
                  >
                    ACTIVATE DEPLOYMENT
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Narrative pay-load detonator */}
        <div className="bg-black border border-[#FFB000]/30 p-2 flex flex-col gap-2">
          <h3 className="text-white font-bold uppercase tracking-tight text-xs border-b border-[#FFB000]/15 pb-1">
            NARRATIVE STRIFE & DECEPTIVE CAMPAIGNS
          </h3>

          <div className="bg-black border border-[#FFB000]/15 p-2 flex flex-col gap-2">
            <div className="text-[10px] text-white/80 leading-snug">
              Assemble coordinated campaigns via news channels to artificially spike <span className="text-[#FFB000] font-bold">INFLATION PERCEPTION</span>. Force 40% corporate value retraction and complete TVL capital flight.
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[9px] text-[#FFB000] uppercase tracking-wider">TARGET SOVEREIGN DIVISION</label>
              <select 
                value={targetCountry} 
                onChange={e => setTargetCountry(e.target.value)}
                className="bg-black border border-[#FFB000]/30 p-1 text-white text-xs outline-none focus:border-[#FFB000]"
              >
                {Object.values(state.countries).map((c: any) => (
                  <option key={c.id} value={c.id}>{c.name} ({c.id})</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[9px] text-[#FFB000] uppercase tracking-wider">TARGET PRIVATE SECURITY TICKER</label>
              <select 
                value={targetTicker} 
                onChange={e => setTargetTicker(e.target.value)}
                className="bg-black border border-[#FFB000]/30 p-1 text-white text-xs outline-none focus:border-[#FFB000]"
              >
                {Object.keys(state.markets).map(tk => (
                  <option key={tk} value={tk}>{tk}</option>
                ))}
              </select>
            </div>

            <div className="mt-2 pt-1.5 border-t border-[#FFB000]/15 flex flex-col gap-2">
              <div className="flex justify-between items-center text-[10px]">
                <span className="text-[#FFB000]">DEPLOYMENT COST:</span>
                <span className="text-[#FF0000] font-bold font-mono text-sm">$10,000,000,000</span>
              </div>
              
              <button
                onClick={handleDetonate}
                disabled={state.player.cash < 10000000000}
                className={`w-full font-bold uppercase text-[10px] py-1 cursor-pointer select-none border ${
                  state.player.cash >= 10000000000
                    ? 'bg-[#FF0000] text-white hover:bg-[#FF0000]/80 border-[#FF0000]'
                    : 'bg-black text-white/20 border-white/10 cursor-not-allowed'
                }`}
              >
                {state.player.cash >= 10000000000 
                  ? 'DETONATE NARRATIVE STRIKE' 
                  : 'INSUFFICIENT BUDGET (REQS $10.0B)'}
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
