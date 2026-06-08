/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { SimState, Country } from '../types';

interface MacroPanelProps {
  state: SimState;
  onBuyBonds: (countryId: string, amount: number) => void;
  onTogglePrinting: (countryId: string) => void;
}

export const MacroPanel: React.FC<MacroPanelProps> = ({ state, onBuyBonds, onTogglePrinting }) => {
  return (
    <div className="p-2 flex flex-col gap-2 overflow-y-auto h-full font-mono text-xs select-none bg-black text-[#FFB000]">
      <div className="flex flex-col gap-0.5 border-b border-[#FFB000]/30 pb-1.5">
        <h2 className="text-[#FFB000] font-bold uppercase text-xs tracking-tight">
          SOVEREIGN TREASURY DESK & CREDIT DECOLLECTION
        </h2>
        <p className="text-white/60 text-[10px]">
          ACQUIRE NATIONAL DEBT BONDS TO EXTRACTION GDP LIQUIDITY YIELD STREAMS. REQUISITES: 80% LOBBY MATRIX CONTROL TO ENGAGE DIRECT MONETIZATION STRIKES.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-2">
        {Object.values(state.countries).map((country: any) => {
          const lobbyNode = state.influenceNodes.find(n => n.type === 'Lobby' && n.nation === country.id);
          const controlPercent = lobbyNode ? lobbyNode.playerControlWeight : 0;
          const playerBondsHeld = state.player.assets.bonds[country.id] || 0;

          // Compute current yield with risk premium built in
          const debtRatio = country.bondsIssued / (country.gdp || 1);
          const creditSpread = Math.max(0.001, (debtRatio - 0.5) * 0.05);
          const currentYield = country.interestRate + creditSpread;

          return (
            <div key={country.id} className="bg-black border border-[#FFB000]/30 p-1.5 flex flex-col gap-2">
              
              {/* Header metrics card */}
              <div className="flex justify-between items-start border-b border-[#FFB000]/15 pb-1">
                <div>
                  <h3 className="text-white font-bold uppercase text-xs">
                    {country.name} ({country.id})
                  </h3>
                  <p className="text-[9px] text-[#FFB000]/80 mt-0.5">
                    LOBBY WEIGHT: <span className="text-[#00FF00] font-bold">{controlPercent.toFixed(1)}%</span>
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 ${
                    country.centralBank.printingPressOverride ? 'bg-[#FF0000]' : 'bg-[#00FF00]'
                  }`}></span>
                  <span className="text-[9px] text-white">
                    {country.centralBank.printingPressOverride ? 'MONETARY OVERRIDE IN OPERATION' : 'REGULATOR COMPLIANT'}
                  </span>
                </div>
              </div>

              {/* Stats values grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5">
                <div className="bg-black p-1 border border-[#FFB000]/15">
                  <div className="text-[9px] text-white/50 uppercase tracking-wider">ANNUAL GDP</div>
                  <div className="text-[11px] font-bold text-white">
                    ${(country.gdp / 1e12).toFixed(2)}T
                  </div>
                </div>
                <div className="bg-black p-1 border border-[#FFB000]/15">
                  <div className="text-[9px] text-white/50 uppercase tracking-wider">INFLATION RATE</div>
                  <div className={`text-[11px] font-bold ${country.inflation > 0.045 ? 'text-[#FF0000] font-bold' : 'text-white'}`}>
                    {(country.inflation * 100).toFixed(2)}%
                  </div>
                </div>
                <div className="bg-black p-1 border border-[#FFB000]/15">
                  <div className="text-[9px] text-white/50 uppercase tracking-wider">SOVEREIGN INTEREST rate</div>
                  <div className="text-[11px] font-bold text-white">
                    {(country.interestRate * 100).toFixed(2)}%
                  </div>
                </div>
                <div className="bg-black p-1 border border-[#FFB000]/15">
                  <div className="text-[9px] text-white/50 uppercase tracking-wider">PUBLIC DEBT ISSUED</div>
                  <div className="text-[11px] font-bold text-white">
                    ${(country.bondsIssued / 1e12).toFixed(2)}T
                  </div>
                </div>
              </div>

              {/* Action layout */}
              <div className="flex flex-wrap gap-2 items-center justify-between mt-0.5 pt-1.5 border-t border-[#FFB000]/15 text-[10px]">
                {/* Bonds Holdings status */}
                <div>
                  <span className="text-white/60">YOUR HOLDINGS:</span>{' '}
                  <span className="text-[#00FF00] font-bold">
                    ${playerBondsHeld.toLocaleString()}
                  </span>{' '}
                  <span className="text-white/50 text-[9px]">
                    (YIELD/WK: ${(playerBondsHeld * (currentYield / 52)).toLocaleString(undefined, { maximumFractionDigits: 0 })})
                  </span>
                </div>

                <div className="flex gap-1.5">
                  <button
                    onClick={() => onBuyBonds(country.id, 5000000000)}
                    disabled={state.player.cash < 5000000000}
                    className={`font-mono text-[9px] font-bold py-0.5 px-2 cursor-pointer ${
                      state.player.cash >= 5000000000 
                        ? 'bg-[#00FF00] text-black hover:opacity-90' 
                        : 'bg-black text-white/20 border border-white/10 cursor-not-allowed'
                    }`}
                  >
                    BUY $5B BONDS
                  </button>

                  <button
                    onClick={() => onTogglePrinting(country.id)}
                    disabled={controlPercent < 80}
                    className={`font-mono text-[9px] font-bold py-0.5 px-2 cursor-pointer ${
                      controlPercent >= 80 
                        ? country.centralBank.printingPressOverride
                          ? 'bg-[#FF0000] text-white'
                          : 'bg-[#FFB000] text-black' 
                        : 'bg-black text-white/20 border border-white/10 cursor-not-allowed'
                    }`}
                  >
                    {controlPercent >= 80
                      ? country.centralBank.printingPressOverride
                        ? 'STOP GENERAL PRESS PRINT'
                        : 'OVERRIDE BANK PRESS PRINT'
                      : 'OVERRIDE BLOCKED (REQS 80% LOBBY)'}
                  </button>
                </div>
              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
};
